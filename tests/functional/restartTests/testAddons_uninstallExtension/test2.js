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
 *   Vlad Maniac <vmaniac@mozilla.com> (original author)
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
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

const TIMEOUT_USER_SHUTDOWN = 2000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
}

/**
 * Tests for successful add-on installation and disables one add-on
 */
function testDisableExtension() {
  addonsManager.open();

  // Go to extensions pane
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  var enabledExtension = addonsManager.getAddons({attribute: "value", 
                                                  value: persisted.addons[0].id})[0]; 
  var toDisableExtension = addonsManager.getAddons({attribute: "value", 
                                                    value: persisted.addons[1].id})[0]; 

  // Check that the extensions were installed
  assert.ok(addonsManager.isAddonInstalled({addon: enabledExtension}),
            "Extension '" + persisted.addons[0].id + "' was installed");
  assert.ok(addonsManager.isAddonInstalled({addon: toDisableExtension}),
            "Extension '" + persisted.addons[1].id + "' was installed");

  // Disable the extension
  addonsManager.disableAddon({addon: toDisableExtension});

  // Check that the extension was marked for disable
  assert.equal(toDisableExtension.getNode().getAttribute("pending"), "disable", 
               "The extension '" + persisted.addons[1].id + "' was marked for disable");

  // Restart the browser using restart prompt
  var restartLink = addonsManager.getElement({type: "listView_restartLink", 
                                              parent: toDisableExtension});

  // XXX Bug 747418
  // startUserShutdown is broken. Needs to wait for Mozmill 2.0
  //controller.startUserShutdown(TIMEOUT_USER_SHUTDOWN, true);
  //controller.click(restartLink); 
}  
