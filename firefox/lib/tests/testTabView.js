/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert, expect } = require("../../../lib/assertions");
var tabViews = require("../tabview");

const TEST_DATA = "http://www.mozilla.org";

const NODES = [
  {type: "contentArea", parent: undefined},
  {type: "deck", parent: undefined},
  {type: "exitButton", parent: undefined},
  {type: "search_box", parent: undefined},
  {type: "search_button", parent: undefined},
];

function setupModule() {
  controller = mozmill.getBrowserController();
  tabView = new tabViews.tabView(controller);
}

function testTabViewClass() {
  // Open and close TabView
  tabView.open();
  tabView.close();

  // Reopen again for upcoming tests
  tabView.open();

  // Test all available elements
  NODES.forEach(function (aElement) {
    var node = tabView.getElement({
      type: aElement.type,
      subtype: aElement.subtype,
      value: aElement.value,
      parent: aElement.parent
    });

    assert.ok(node.exists(), "Element has been found");
  });


  expect.equal(tabView.getGroups().length, 1, "One tab group exists");

  // Get the first group and its title
  var groups = tabView.getGroups();
  var title = tabView.getGroupTitleBox({group: groups[0]});

  // Check if the same tab group we are getting by default title is identical
  var groupByTitle = tabView.getGroups({
    filter: "title",
    value: title.getNode().value
  })[0];

  expect.equal(groups[0].getNode(), groupByTitle.getNode(),
               "Group get from index is identical to the group get from title");

  // Check if the the active tab group is identical to the first one
  var groupByActive = tabView.getGroups({filter: "active"})[0];
  expect.equal(groups[0].getNode(), groupByActive.getNode(),
               "Group get from index is identical to the active group");

  // Setting a new title for the first tab group
  var name = "First Tab Group";
  controller.type(title, name);

  expect.equal(title.getNode().value, name, "New group title has been set");

  // Add a new tab to the first tab group
  var tabCountBefore = tabView.getTabs().length;

  // Open a new tab
  tabView.openTab({group: groups[0]});

  // TabView will be closed. So lets reopen it again with a website loaded
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var pageTitle = controller.tabs.activeTab.title;
  tabView.open();

  expect.equal(tabView.getTabs().length, tabCountBefore + 1,
               "The new tab should be visible when reopening the TabView");

  // Get the tabs from inside the first group
  var tabs = tabView.getTabs({filter: "group", value: groups[0]});

  expect.equal(tabView.getTabs().length, tabs.length,
               "The number of tabs in the default group matches the number of all tabs");

  var tab = tabView.getTabs({filter: "active"})[0];
  var title = tabView.getTabTitleBox({tab: tab});
  expect.equal(title.getNode().textContent, pageTitle,
               "Active tab is the Add-ons Website");

  // Reset Tab View settings
  tabView.reset();

  tabView.open();
  groups = tabView.getGroups();

  // There shouldn't exist a tab not assigned to a group
  var tabsNoGroup = tabView.getTabs({filter: "group"});
  expect.equal(tabsNoGroup.length, 0, "No tab without a group should exist");

  // Close the first tab group and undo the action
  tabView.closeGroup({group: groups[0]});
  tabView.undoCloseGroup({group: groups[0]});

  tabView.close();
}
