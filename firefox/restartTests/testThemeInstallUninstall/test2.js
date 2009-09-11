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

/**
 * Litmus test #5930: Install a theme
 */

// Include necessary modules
var RELATIVE_ROOT = '../../../shared-modules';
var MODULE_REQUIRES = ['UtilsAPI'];

// Shared variable
var gThemeName = "Walnut for Firefox";
const gTimeout = 5000;

var setupModule = function(module) {
  // The Add-ons Manager is not opened automatically as what happens for new extensions
  module.controller = mozmill.getAddonsController();
}

var testCheckInstalledTheme = function() {
  // Select the Themes pane
  var themesPane = new elementslib.ID(controller.window.document, "themes-view");
  controller.sleep(100);
  controller.waitThenClick(themesPane, gTimeout);

  // The installed theme should be the current theme in the list
  // XXX: Use the add-on uuid to access the entry directly until we can pass the info
  // between restart test files (bug 500987)
  var item = new elementslib.Lookup(controller.window.document, '/id("extensionsManager")/id("addonsMsg")/id("extensionsBox")/[1]/id("extensionsView")/id("urn:mozilla:item:{5A170DD3-63CA-4c58-93B7-DE9FF536C2FF}")');
  controller.waitThenClick(item, gTimeout);

  // Check if the Walnut Theme is the current theme
  if (!item.getNode().getAttribute('current')) {
    throw gThemeName + " is not the currently enabled theme."
  }
}
