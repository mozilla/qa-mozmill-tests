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
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aaron Train <atrain@mozilla.com> (original author)
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
var tabView = require("../../../lib/tabview");

const TABGROUP_TITLE = "Mozilla";

function setupModule(module) {
  controller = mozmill.getBrowserController();
  activeTabView = new tabView.tabView(controller);
}

function teardownModule(module) {
  // Reset Tab Groups View settings
  activeTabView.reset();
}

/**
 *  Setting and verifying a named tab group 
 */
function testTabGroupNaming() {
  // Open Tab Groups View (default via keyboard shortcut)
  activeTabView.open();

  // Verify that one tab group exists
  controller.assert(function () {
    return activeTabView.getGroups().length === 1;
  }, "One tab group exists - got: " + "'" + activeTabView.getGroups().length +
    ", expected: " + "'" + 1 + "'");

  // Get the single tab group and title
  var groups = activeTabView.getGroups();
  var title = activeTabView.getGroupTitleBox({group: groups[0]});

  // Set a name for the tab group
  controller.type(title, TABGROUP_TITLE);

  // Verify that the tab group has a new name
  controller.assert(function () {
    return title.getNode().value === TABGROUP_TITLE;
  }, "Tab group title has been set - got: " + "'" +  title.getNode().value +
    "'" + ", expected: " + "'" + TABGROUP_TITLE + "'");

  // Close Tab Groups View
  activeTabView.close();

  // Open Tab Groups View
  activeTabView.open();

   // Verify that the tab group has retained its new name
  controller.assert(function () {
    return title.getNode().value === TABGROUP_TITLE;
  }, "Tab group title has been set - got: " + "'" +  title.getNode().value +
    "'" + ", expected: " + "'" + TABGROUP_TITLE + "'");

  // Close Tab Groups View
  activeTabView.close();
}
