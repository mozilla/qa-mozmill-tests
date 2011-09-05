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
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Vlad Maniac <vlad.maniac@softvisioninc.eu> (original author)
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
var addons = require("../../../../lib/addons");
var {expect} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

const ADDON_ID = "test-icons@quality.mozilla.org";
const TIMEOUT_USERSHUTDOWN = 2000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
}

/**
* Check for restart prompt after add-on disable action
*/
function testRestartPromptVisible() {
  addonsManager.open();
  
  // Make sure that besides the Add-ons Manager at least one other tab exists
  var getTabCount = controller.tabs.length;

  expect.equal(getTabCount, 2);

  // Get the extensions pane
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  // Get the addon by name 
  var addon = addonsManager.getAddons({attribute: "value", value: ADDON_ID})[0];
 
  // Disable the addon
  addonsManager.disableAddon({addon: addon});
 
  // Check if the restart promt appears in add-ons manager
  var restartLink = addonsManager.getElement({type: "listView_restartLink", 
                                              parent: addon});

  expect.equal(restartLink.getNode().getAttribute("hidden"), "");

  // Click on the list view restart link
  controller.click(restartLink);
  
  // User initiated restart
  controller.startUserShutdown(TIMEOUT_USERSHUTDOWN, true);

  controller.waitFor(function () {
    controller.window.Application.restart(); 
  }, "Timeout exceeded in waiting for user initiated restart");    
}
