/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Geo Mealer <gmealer@mozilla.com>
 *   Dave Hunt <dhunt@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Paths for memory reporters. Use as keys to access the appropriate metrics.
const MEMORY_REPORTERS = {
    HEAP_USED : "heap-used",
    RESIDENT : "resident"
}

// Returning this as a numeric constant to simplify memory calculations
// Neither used nor unused mapped heap memory should be 0 in real life.
const MEMORY_UNAVAILABLE = "0";

// INITIALIZE MEMORY REPORTERS

// gMemReporters will be a dictionary, key=path and val=reporter
// See initMemReporters() for how it's used.
var gMemReporters = {};

/**
 * Initialize the static memory reporters
 *
 * Called during module initialization, below.
 * See also aboutMemory.js in Firefox code
 */
function initMemReporters() {
  var memMgr = Cc["@mozilla.org/memory-reporter-manager;1"].
               getService(Ci.nsIMemoryReporterManager);

  // Grab all the memory reporters, load into gMemReporters as a dictionary
  var e = memMgr.enumerateReporters();
  while (e.hasMoreElements()) {
    var memReporter = e.getNext().QueryInterface(Ci.nsIMemoryReporter);
    gMemReporters[memReporter.path] = memReporter;
  }
}

initMemReporters();

/**
 * PERFORMANCE TRACER
 *
 * Keeps a trace log of both actions and performance statistics
 * throughout a test run.
 *
 * Performance stats currently include mapped and allocated memory.
 * More stats will be added as methods to read them are discovered.
 *
 * Usage:
 *   Before test, create a new PerfTracer named after the test.
 *     Ex: var perf = new performance.PerfTracer("MyTestFunc");
 *
 *   During test, after notable actions call PerfTracer.addCheckpoint(label)
 *     Ex: perf.addCheckpoint("Opened preferences dialog");
 *
 *   After test, call PerfTracer.finish()
 *     Ex: perf.finish();
 */

/**
 * PerfTracer constructor
 *
 * @param {string} name
 *        Name of the tracer, currently used in the output title
 */
function PerfTracer(name) {
  if (!name) {
    throw new Error(arguments.callee.name + ": name not supplied.");
  }

  this.clearLog();
  this._name = name;
}

PerfTracer.prototype = {
  // UTILITY METHODS

  /**
   * Format a single result for printing
   *
   * @param {object} result
   *        Result as created by addCheckpoint()
   *        Elements: timestamp {Date}   - date/time
   *                  explicit {number} - explicit memory allocated
   *                  resident {number} - resident memory allocated
   *                  label {string}     - label for result
   *
   * @returns Result string formatted for output
   * @type {string}
   */
  _formatResult : function PerfTracer_formatResult(result) {
    var resultString = result.timestamp.toUTCString() + " | " +
                       result.explicit + " | " +
                       result.resident + " | " +
                       result.label + "\n";

    return resultString;
  },

  /**
   * Sum all MAPPED and HEAP ones that aren't children of other MAPPED/HEAP ones
   *
   * @returns Explicit allocated memory
   * @type {integer}
   */
  _computeExplicit : function PerfTracer_computeExplicit() {
    const MR_MAPPED = Ci.nsIMemoryReporter.MR_MAPPED;
    const MR_HEAP   = Ci.nsIMemoryReporter.MR_HEAP;
    const MR_OTHER  = Ci.nsIMemoryReporter.MR_OTHER;
    
    var mgr = Cc["@mozilla.org/memory-reporter-manager;1"].
              getService(Ci.nsIMemoryReporterManager);
    
    function isPrefix(d1, d2) {
      return d2.match(RegExp("^" + d1)) && d1 != d2;
    }
    
    // Put all MAPPED reporters into an array.  And get heap-used.
    var heapUsed = -1;
    var e = mgr.enumerateReporters();
    var a = [];
    while (e.hasMoreElements()) {
      var r = e.getNext().QueryInterface(Ci.nsIMemoryReporter);
      if (r.kind === MR_MAPPED) {
        var r2 = {
          path:       r.path,
          memoryUsed: r.memoryUsed
        }
        a.push(r2);
      }
      else if (r.path === MEMORY_REPORTERS.HEAP_USED) {
        heapUsed = r.memoryUsed;
      }
    }
    
    // Zero any reporter that is a child of another reporter.  Eg. if we have
    // "explicit/a" and "explicit/a/b", remove the latter.  This is quadratic in
    // the number of MAPPED reporters, but there shouldn't be many.
    for (var i = 0; i < a.length; i++) {
      for (var j = i + 1; j < a.length; j++) {
        var r1 = a[i], r2 = a[j];
        if (r1.path === r2.path) {
          // Duplicates;  include both, we'll sum them.
        }
        else if (isPrefix(r1.path, r2.path)) {
          // r1 is a parent of r2, zero r2.
          r2.memoryUsed = 0;
        }
        else if (isPrefix(r2.path, r1.path)) {
          // r2 is a parent of r1, zero r1.
          r1.memoryUsed = 0;
        }
      }
    }
    
    // Sum all the reporters and heapUsed.
    var explicit = heapUsed;
    for (var i = 0; i < a.length; i++) {
      explicit += a[i].memoryUsed;
    }
    
    return explicit;
  },

  // PUBLIC INTERFACE

  /**
   * Get a memory value from a reporter
   *
   * @param {string} path
   *        Path of memory reporter (e.g. PATH_MAPPED)
   * @returns Memory value from requested reporter, MEMORY_UNAVAILABLE if 
   *          not found
   * @type {number}
   */
  getMemory : function PerfTracer_getMemory(path) {
    var val = MEMORY_UNAVAILABLE;
    if (path in gMemReporters) {
      val = gMemReporters[path].memoryUsed;
    }

    return val;
  },

  /**
   * Clears the tracker log and starts over
   */
  clearLog : function PerfTracer_clearLog() {
    this._log = new Array();
  },

  /**
   * Adds a checkpoint to the tracker log, with time and performance info
   *
   * @param {string} aLabel
   *        Label attached to performance results. Typically should be
   *        whatever the test just did.
   */
  addCheckpoint : function PerfTracer_addCheckpoint(aLabel) {
    var result = {
      label : aLabel,
      timestamp : new Date(),
      explicit : this._computeExplicit(),
      resident : this.getMemory(MEMORY_REPORTERS.RESIDENT)
    };

    this._log.push(result);
  },

  /**
   * Prints all results to console.
   * XXX: make this work with output files
   */
  finish : function PerfTracer_finish() {
    // Title
    var title = "Performance Trace (" + this._name + ")";
    
    // Separator
    var sep = "";
    for(var i = 0; i < title.length; i++) {
      sep += "=";
    }

    dump(sep + "\n");
    dump(title + "\n");
    dump(sep + "\n");

    // Log
    for(i = 0; i < this._log.length; i++) {
      dump(this._formatResult(this._log[i]));
    }
  }
}

// Exported constants
exports.MEMORY_REPORTERS = MEMORY_REPORTERS;
exports.MEMORY_UNAVAILABLE = MEMORY_UNAVAILABLE;

// Exported class
exports.PerfTracer = PerfTracer;
