/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var tabs = require("../../../lib/tabs");

const localTestFolder = collector.addHttpResource('../../../data/');

const TIMEOUT_ARROWS = 10000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();

  scrollButtonDown = tabBrowser.getElement({type: "tabs_scrollButton", subtype: "down"});
  scrollButtonUp = tabBrowser.getElement({type: "tabs_scrollButton", subtype: "up"});
  allTabsButton = tabBrowser.getElement({type: "tabs_allTabsButton"});
  allTabsPopup = tabBrowser.getElement({type: "tabs_allTabsPopup"});
}

var teardownModule = function()
{
  tabBrowser.closeAllTabs();

  // Just in case the popup hasn't been closed yet
  allTabsPopup.getNode().hidePopup();
}

var testScrollBackgroundTabIntoView = function()
{
  // Open the testcase
  controller.open(localTestFolder + "tabbedbrowsing/openinnewtab.html");
  controller.waitForPageLoad();

  var link1 = new elementslib.Name(controller.tabs.activeTab, "link_1");
  var link2 = new elementslib.Name(controller.tabs.activeTab, "link_2");

  controller.waitFor(function () {
    tabBrowser.openInNewTab(link1);

    // Wait until the pages have been loaded, so they can be loaded from the cache
    var tab = controller.tabs.getTab(controller.tabs.length - 1);
    controller.waitForPageLoad(tab);

    var down_visible = !scrollButtonDown.getNode().hasAttribute("collapsed");
    var up_visible = !scrollButtonUp.getNode().hasAttribute("collapsed");
    return down_visible && up_visible;
  }, "Scroll arrows are visible after a couple tabs have been opened", TIMEOUT_ARROWS);

  // XXX: Bug 624027
  // Not sure for which state we have to wait here, but without the sleep
  // call or smaller numbers the test always fails on Windows. Lets see
  // if the fix for bug 578162 will solve it.
  controller.sleep(100);

  // Open one more tab but with another link for later verification
  tabBrowser.openInNewTab(link2);

  // Check that the right scroll button flashes
  controller.waitFor(function () {
    return scrollButtonDown.getNode().hasAttribute('notifybgtab');
  }, "Right scroll arrow has been highlighted");

  controller.waitFor(function () {
    return !scrollButtonDown.getNode().hasAttribute('notifybgtab');
  }, "Hightlight should be removed immediately");

  // Check that the correct link has been loaded in the last tab
  var lastTabIndex = controller.tabs.length - 1;
  var linkId = new elementslib.ID(controller.tabs.getTab(lastTabIndex), "id");

  // Need to wait for element to appear, then we check text is correct
  controller.waitForElement(linkId);
  controller.assertText(linkId, "2");

  // and is displayed inside the all tabs popup menu
  controller.click(allTabsButton);

  controller.waitFor(function () {
    return allTabsPopup.getNode().state == 'open';
  }, "The all tabs popup should have been opened");

  // Check that the correct title is shown for all tabs except the last one
  // Last tab in the 'List all Tabs' menu
  var lastMenuItemIndex = allTabsPopup.getNode().childNodes.length - 1;

  for (var i = 3; i < lastMenuItemIndex; i++) {
    controller.waitFor(function () {
      var node = allTabsPopup.getNode().childNodes[i];
      return node && node.label == '1';
    }, "Link 1 title is visible for the tab");
  }

  // Also check the last title
  controller.waitFor(function () {
    var node = allTabsPopup.getNode().childNodes[lastMenuItemIndex];
    return node && node.label == '2';
  }, "Link 2 title is visible for the last tab");

  // Close the all tabs menu
  controller.click(allTabsButton);
  controller.waitFor(function () {
    return allTabsPopup.getNode().state == 'closed';
  }, "The all tabs popup should have been closed");
}

/**
 * Map test functions to litmus tests
 */
// testOpenInBackgroundTab.meta = {litmusids : [8259]};
