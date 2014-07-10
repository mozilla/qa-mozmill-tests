/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("addons");
var graphics = require("graphics");
var performance = require("performance");

var frame = {};
Cu.import('resource://mozmill/modules/frame.js', frame);

/**
 * Constructor
 *
 * @constructor
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function EnduranceManager(aController) {
  this._controller = aController;
  this._perfTracer = new performance.PerfTracer("Endurance");
  this._currentIteration = 1;
  this._currentEntity = 1;
  if ("endurance" in persisted) {
    this._delay = persisted.endurance.delay;
    this._iterations = persisted.endurance.iterations;
    this._entities = persisted.endurance.entities;
  }
  else {
    // Running the endurance test directly so set default values
    this._delay = 100;
    this._iterations = 1;
    this._entities = 1;
  }

  addons.submitInstalledAddons();
  graphics.submitGraphicsInformation();
}

/**
 * Endurance class
 */
EnduranceManager.prototype = {

  /**
   * Get the number of entities
   *
   * @returns {Number} Number of entities
   */
  get entities() {
    return this._entities;
  },

  /**
   * Get the current entity
   *
   * @returns {Number} Current entity
   */
  get currentEntity() {
    return this._currentEntity;
  },

  /**
   * Get the number of iterations
   *
   * @returns {Number} Number of iterations
   */
  get iterations() {
    return this._iterations;
  },

  /**
   * Get the current iteration
   *
   * @returns {Number} Current iteration
   */
  get currentIteration() {
    return this._currentIteration;
  },

  /**
   * Run endurance test
   *
   * @param {function} aCallback
   *        Callback function to call
   */
  run : function endurance_run(aCallback) {
    var _testResults = {
      testMethod : frame.events.currentTest.__name__,
      testFile : frame.events.currentModule.__file__,
      iterations : [ ]
    };

    try {
      for (var i = 0; i < this._iterations; i++) {
        this._currentIteration = i + 1;
        this._controller.sleep(this._delay);
        this._perfTracer.addCheckpoint("Start iteration");

        try {
          // Run the main test method
          aCallback();
          this._perfTracer.addCheckpoint("End iteration");
        }
        finally {
          _testResults.iterations.push({"checkpoints" : this._perfTracer._log});
          this._perfTracer.clearLog();
        }
      }
    }
    finally {
      frame.events.fireEvent('enduranceResults', _testResults);
    }
  },

  /**
   * Loop through each of the entities
   *
   * @param {function} aCallback
   *        Callback function to call
   */
  loop : function endurance_loop(aCallback) {
    for (var i = 0; i < this._entities; i++) {
      this._currentEntity = i + 1;
      aCallback();
      this._controller.sleep(this._delay);
    }
  },

  /**
   * Add a checkpoint.
   *
   * @param {string} aLabel
   *        Label for checkpoint
   */
  addCheckpoint : function endurance_addCheckpoint(aLabel) {
    this._perfTracer.addCheckpoint(aLabel +
                                   " [i:" + this._currentIteration +
                                   " e:" + this._currentEntity + "]");
  }

}

// Export of classes
exports.EnduranceManager = EnduranceManager;
