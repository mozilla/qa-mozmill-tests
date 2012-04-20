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
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

const TIMEOUT_USER_SHUTDOWN = 2000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
}

/**
 * Verifies the theme is installed and enabled
 */
function testThemeIsInstalled() {
  addonsManager.open();

  // Verify the plain-theme is installed
  var plainTheme = addonsManager.getAddons({attribute: "value", 
                                            value: persisted.theme[0].id})[0];

  assert.ok(addonsManager.isAddonInstalled({addon: plainTheme}), 
            "The theme '" + persisted.theme[0].id + "' is installed");

  // Verify the plain-theme is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: plainTheme}), 
            "The theme '" + persisted.theme[0].id + "' is enabled");

  // Enable the default theme
  var defaultTheme = addonsManager.getAddons({attribute: "value", 
                                              value: persisted.theme[1].id})[0];

  addonsManager.enableAddon({addon: defaultTheme});

  // Verify that default theme is marked to be enabled
  assert.equal(defaultTheme.getNode().getAttribute("pending"), "enable");

  // Restart the browser using restart prompt
  var restartLink = addonsManager.getElement({type: "listView_restartLink", 
                                              parent: defaultTheme});

  // XXX Bug 747418
  // startUserShutdown is broken. Needs to wait for Mozmill 2.0
  //controller.startUserShutdown(TIMEOUT_USER_SHUTDOWN, true);
  //controller.click(restartLink); 
}
