/* * ***** BEGIN LICENSE BLOCK *****
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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Clint Talbert <ctalbert@mozilla.com>
 *   Henrik Skupin <hskupin@gmail.com>
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
 * **** END LICENSE BLOCK ***** */

var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrefsAPI'];

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testPrefHelperClass = function () {
  // Attempt default behavior
  PrefsAPI.handlePreferencesDialog(doPref);

  // Launch with menu clicks
  PrefsAPI.handlePreferencesDialog(doPref, launchPrefsWithMenu);

  // Launch with keystroke
  PrefsAPI.handlePreferencesDialog(doPref, launchPrefsWithKeys);
}

/**
 * This function is a callback to demonstrate launching the preference dialog
 * from the menu.
 */
function launchPrefsWithMenu() {
  if (mozmill.isWindows) {
    controller.click(new elementslib.Elem(controller.menus["tools-menu"].menu_preferences));
  } else if (mozmill.isMac) {
    // We can't access the application menu in Mac, so let's just use the
    // standard method instead
    mozmill.getPreferencesController();
  } else if (mozmill.isLinux) {
    controller.click(new elementslib.Elem(controller.menus["edit-menu"].menu_preferences));
  }
}

/**
 * This function is a callback to demonstrate launching the preference dialog
 * using keystrokes.
 */
function launchPrefsWithKeys() {
  if (mozmill.isWindows) {
    controller.keypress(null, "t", {altKey: true});
    controller.sleep(200);
    controller.keypress(null, "o", {});
  }
  else if (mozmill.isMac) {
    // Doesn't work due to system menu
    //controller.keypress(null, ",", {accelKey: true});

    mozmill.getPreferencesController();
  }
  else if (mozmill.isLinux) {
    controller.keypress(null, "e", {altKey: true});
    controller.sleep(200);
    controller.keypress(null, "n", {});
  }
}

/**
 * This is the handler code that just flips through the preference dialog. Here is
 * where you'd interact with the preference dialog
 */
function doPref(prefcontrol) {
  prefcontrol.click(new elementslib.Lookup(prefcontrol.window.document, '/id("BrowserPreferences")/anon({"orient":"vertical"})/anon({"anonid":"selector"})/{"pane":"paneContent"}'));
  prefcontrol.sleep(500);

  prefcontrol.click(new elementslib.ID(prefcontrol.window.document, "enableJava"));
  prefcontrol.sleep(500);

  prefcontrol.click(new elementslib.ID(prefcontrol.window.document, "enableJava"));
  prefcontrol.sleep(500);

  prefcontrol.keypress(null, "VK_ESCAPE", {});
}
