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
var addons = require("../addons");

const TIMEOUT = 5000;

const MOZMILL = {
  name : "MozMill",
  id : "mozmill@mozilla.com"
};

const SEARCH_ADDON = {
  name : "MozMill Crowd",
  id : "mozmill-crowd@quality.mozilla.org"
}


function setupModule() {
  controller = mozmill.getBrowserController();

  am = new addons.AddonsManager(controller);
}

function testAddonsAPI() {
  am.open({type: "shortcut"});

  // Switch to the extension pane
  var category = am.getCategoryById({id: "extension"});
  am.setCategory({category: category});

  var addonsList = am.getElement({type: "addonsList"});
  controller.assertJSProperty(addonsList, "localName", "richlistbox");

  // Check some properties of the Mozmill extension
  var addon = am.getAddons({attribute: "value", value: MOZMILL.id})[0];
  controller.assertDOMProperty(addon, "name", MOZMILL.name);
  controller.assertDOMProperty(addon, "type", "extension");

  // Disable Mozmill in the list view and re-enable it in the details view
  am.disableAddon({addon: addon});
  controller.click(am.getAddonLink({addon: addon, link: "more"}));
  am.enableAddon({addon: addon});

  // Disable automatic updates (Doesn't work at the moment)
  var updateCheck = am.getAddonRadiogroup({addon: addon, radiogroup: "findUpdates"});

  // Open recent updates via utils button
  var recentUpdates = am.getCategoryById({id: "recentUpdates"});
  am.waitForCategory({category: recentUpdates}, function () {
    am.handleUtilsButton({item: "viewUpdates"});
  });

  // The search result for Mozmill Crowd has to show the remote pane per default
  am.search({value: SEARCH_ADDON.name});
  controller.assert(function() {
    return am.getSearchFilterValue({filter: am.selectedSearchFilter}) === "remote";
  }, "The remote search filter is active per default.");
  controller.assert(function() {
    return am.getSearchResults().length === 1;
  }, "One result has to be shown with the remote filter active.");

  am.selectedSearchFilter = "local";
  controller.assert(function() {
    return am.getSearchFilterValue({filter: am.selectedSearchFilter}) === "local";
  }, "The local search filter is active.");

  // Mozmill should be marked as installed
  controller.assert(function() {
    return am.isAddonInstalled({addon: addon});
  }, "MozMill is marked as being installed");

  // Get first search result and check it is not installed
  addon = am.getAddons()[0];
  controller.assert(function() {
    return !am.isAddonInstalled({addon: addon});
  }, "First search result is marked as not being installed");

  // Install the first search result and undo the action immediately
  // TODO: Needs update to support installation of addons in the search view
  //am.installAddon({addon: addon});
  //am.undo({addon: addon});

  am.close();
}
