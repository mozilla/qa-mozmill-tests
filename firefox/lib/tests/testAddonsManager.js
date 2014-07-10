/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../addons");
var { expect } = require("../../../lib/assertions");

const MOZMILL = {
  name : "Mozmill",
  id : "mozmill@mozilla.com"
};

const SEARCH_ADDON = {
  name : "MemChaser",
  id : "memchaser@quality.mozilla.org"
}


function setupModule() {
  controller = mozmill.getBrowserController();
  am = new addons.AddonsManager(controller);
}

function teardownTest() {
  // Force close the Add-ons Manager
  am.close(true);
}

function testOpenAMO() {
  // Open AMO with an about:newtab tab opened
  this.controller.mainMenu.click("#menu_newNavigatorTab");
  am.open();
  expect.ok(am.isOpen, "Add-ons Manager is opened.");

  // Open AMO while an instance it's already opened
  am.open();
  expect.ok(am.isOpen, "Add-ons Manager is opened.");

  am.close();
  expect.ok(!am.isOpen, "Add-ons Manager is closed.");
}

function testAddonsAPI() {
  am.open({type: "shortcut"});

  // Switch to the extension pane
  var category = am.getCategoryById({id: "extension"});
  am.setCategory({category: category});

  var addonsList = am.getElement({type: "addonsList"});
  expect.equal(addonsList.getNode().localName, "richlistbox",
               "Correct node type for list of add-ons");

  var addon = am.getAddons({attribute: "value", value: MOZMILL.id})[0];
  expect.equal(addon.getNode().getAttribute('name'), MOZMILL.name,
               "Add-on has the correct name");
  expect.equal(addon.getNode().getAttribute('type'), "extension",
               "Add-on is of type 'extension'");

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

  // The search result for MemChaser has to show the remote pane per default
  am.search({value: SEARCH_ADDON.name});
  expect.equal(am.getSearchFilterValue({filter: am.selectedSearchFilter}), "remote",
               "The remote search filter is active per default.");
  expect.equal(am.getSearchResults().length, 1,
               "One result has to be shown with the remote filter active.");

  am.selectedSearchFilter = "local";
  expect.equal(am.getSearchFilterValue({filter: am.selectedSearchFilter}), "local",
               "The local search filter is active.");

  // Mozmill should be marked as installed
  expect.ok(am.isAddonInstalled({addon: addon}), "MozMill is marked as being installed");

  // Get first search result and check it is not installed
  addon = am.getAddons()[0];
  expect.ok(!am.isAddonInstalled({addon: addon}), "First search result is marked as not being installed");

  // Install the first search result and undo the action immediately
  // TODO: Needs update to support installation of addons in the search view
  //am.installAddon({addon: addon});
  //am.undo({addon: addon});

  am.close();
  expect.ok(!am.isOpen, "Add-ons Manager is closed.");

  var closeError = false;
  try {
    am.close();
  }
  catch (ex) {
    closeError = true;
  }
  expect.ok(closeError, "Exception thrown because Add-ons Manager has already been closed.")
}
