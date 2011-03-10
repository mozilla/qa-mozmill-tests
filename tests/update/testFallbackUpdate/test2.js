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

function setupModule(module) {
  controller = mozmill.getBrowserController();
  update = new softwareUpdate.softwareUpdate();

  persisted.updates[persisted.updateIndex].fallback = true;
}

function teardownModule() {
  // Store information for fallback patch
  persisted.updates[persisted.updateIndex].patch_fallback = update.patchInfo;
}

/**
 * Test that the patch hasn't been applied and the complete patch gets downloaded
 **/
function testFallbackUpdate_ErrorPatching() {
  // The dialog should be open in the background and shows a failure
  update.waitForDialogOpen(controller);

  // Complete updates have to be handled differently
  if (persisted.updates[persisted.updateIndex].patch.is_complete) {
    // Wait for the error page and close the software update dialog
    update.waitForWizardPage(softwareUpdate.WIZARD_PAGES.errors);
    update.closeDialog();

    // Open the software update dialog again and wait until the check has been finished
    update.openDialog(controller);
    update.waitForCheckFinished();

    // Download the update
    update.controller.waitFor(function() {
      return update.updatesFound;
    }, "An update has been found.");

    update.download(persisted.channel);
  } else {
    update.waitForWizardPage(softwareUpdate.WIZARD_PAGES.errorPatching);

    // Start downloading the fallback update
    update.download(persisted.channel);
  }
}
