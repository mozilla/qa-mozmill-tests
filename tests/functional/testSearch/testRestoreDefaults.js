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
 *   Henrik Skupin <hskupin@mozilla.com>
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

// Include necessary modules
var {expect} = require("../../../lib/assertions");
var search = require("../../../lib/search");

// Global variable to share engine names
var gSharedData = { preEngines: [ ] };

function setupModule(module) {
  controller = mozmill.getBrowserController();
  searchBar = new search.searchBar(controller);
}

function teardownModule(module) {
  searchBar.restoreDefaultEngines();
}

/**
 * Manage search engine (Restoring Defaults)
 */
function testRestoreDefaultEngines() {
  // Remove some default search engines
  searchBar.openEngineManager(removeEngines);

  // Reopen the dialog to restore the defaults
  searchBar.openEngineManager(restoreEngines);

  // XXX: For now sleep 0ms to get the correct sorting order returned
  controller.sleep(0);

  // Check the ordering in the drop down menu
  var engines = searchBar.visibleEngines;
  for (var i = 0; i < engines.length; i++) {
    expect.equal(engines[i].name, gSharedData.preEngines[i].name,
                 "Engine has been restored at the correct position.")
  }
}

/**
 * Remove some of the default search engines
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function removeEngines(controller) {
  var manager = new search.engineManager(controller);

  // Save initial state
  gSharedData.preEngines = manager.engines;

  // Remove all engines until only 1 is left
  for (var i = manager.engines.length; i > 1; i--) {
    var name = manager.engines[i - 1].name;

    manager.removeEngine(name);
    controller.waitFor(function () {
      return manager.engines.length === i - 1;
    }, "Engine '" + name + "' has been removed.");
  }

  manager.close(true);
}

/**
 * Restore the default engines
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function restoreEngines(controller) {
  var manager = new search.engineManager(controller);

  manager.restoreDefaults();
  manager.close(true);
}
