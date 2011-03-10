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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
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

// Include required modules
var softwareUpdate = require("../../../lib/software-update");
var utils = require("../../../lib/utils");

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  update = new softwareUpdate.softwareUpdate();

  // Collect some data of the current build
  persisted.updates[persisted.updateIndex].build_post = update.buildInfo;
}

/**
 * Test that the update has been correctly applied and no further updates
 * can be found.
 */
var testFallbackUpdate_AppliedAndNoUpdatesFound = function() {
  // Open the software update dialog and wait until the check has been finished
  update.openDialog(controller);
  update.waitForCheckFinished();

  // No updates should be offered now - filter out major updates
  try {
    update.assertUpdateStep('noupdatesfound');
  } catch (ex) {
    // If a major update is offered we shouldn't fail
    controller.assert(function() {
      return update.updateType != persisted.updates[persisted.updateIndex].type;
    }, "No more update of the same type offered.");
  }

  // Check that updates have been applied correctly
  update.assertUpdateApplied(persisted);

  // Update was successful
  persisted.updates[persisted.updateIndex].success = true;
}
