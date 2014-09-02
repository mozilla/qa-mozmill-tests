/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var domUtils = require("../../../../lib/dom-utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "tabbedbrowsing/openinnewtab.html";

const TIMEOUT_ARROWS = 10000;

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.tabBrowser.closeAllTabs();

  aModule.scrollButtonDown = tabBrowser.getElement({type: "tabs_scrollButton", subtype: "down"});
  aModule.scrollButtonUp = tabBrowser.getElement({type: "tabs_scrollButton", subtype: "up"});
  aModule.allTabsButton = tabBrowser.getElement({type: "tabs_allTabsButton"});
  aModule.allTabsPopup = tabBrowser.getElement({type: "tabs_allTabsPopup"});
}

var teardownModule = function(aModule) {
  aModule.tabBrowser.closeAllTabs();

  // Just in case the popup hasn't been closed yet
  allTabsPopup.getNode().hidePopup();
}

var testScrollBackgroundTabIntoView = function() {
  // Open the testcase
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var link1 = new elementslib.Name(controller.tabs.activeTab, "link_1");
  var link2 = new elementslib.Name(controller.tabs.activeTab, "link_2");

  assert.waitFor(function () {
    tabBrowser.openTab({method: "middleClick", target: link1});

    // Wait until the pages have been loaded, so they can be loaded from the cache
    var tab = controller.tabs.getTab(controller.tabs.length - 1);
    controller.waitForPageLoad(tab);

    var down_visible = !scrollButtonDown.getNode().hasAttribute("collapsed");
    var up_visible = !scrollButtonUp.getNode().hasAttribute("collapsed");
    return down_visible && up_visible;
  }, "Scroll arrows are visible after a couple tabs have been opened", TIMEOUT_ARROWS);

  // Check that the right scroll button flashes
  var highlighted = false;
  var config = { attributes: true, attributeOldValue: true, attributeFilter: ["notifybgtab"]};

  var obs = new controller.window.MutationObserver(function (aMutations) {
    aMutations.forEach(function (aMutation) {
      highlighted = (aMutation.oldValue == 'true') &&
                    !aMutation.target.hasAttribute('notifybgtab');
    });
  });
  obs.observe(scrollButtonDown.getNode(), config);

  // Open one more tab but with another link for later verification
  tabBrowser.openTab({method: "middleClick", target: link2});

  // Check that the right scroll button flashes
  expect.waitFor(function () {
    return highlighted;
  }, "Right scroll arrow has been highlighted shortly.");

  obs.disconnect();

  // Check that the correct link has been loaded in the last tab
  var lastTabIndex = controller.tabs.length - 1;
  var linkId = new elementslib.ID(controller.tabs.getTab(lastTabIndex), "id");

  controller.waitForElement(linkId);
  expect.equal(linkId.getNode().textContent, "2", "Link text is correct");

  // and is displayed inside the all tabs popup menu
  controller.click(allTabsButton);

  assert.waitFor(function () {
    return allTabsPopup.getNode().state == 'open';
  }, "The all tabs popup should have been opened");

  // Select all opened tabs
  var nodeCollector = new domUtils.nodeCollector(allTabsPopup.getNode());
  nodeCollector.queryNodes(".alltabs-item");

  // Ignore the first tab
  nodeCollector.nodes.shift();

  var countTabs = nodeCollector.nodes.length;
  // Check that the correct title is shown for the last tab
  expect.equal(nodeCollector.nodes[countTabs - 1].label, "2",
               "Link 2 title is visible for the last tab");

  nodeCollector.nodes.pop();

  // Check that the correct title is shown for rest of the tabs
  nodeCollector.nodes.forEach(aTab => {
    expect.equal(aTab.label, "1", "Link 1 title is visible for the tab");
  });

  // Close the all tabs menu
  controller.click(allTabsButton);
  assert.waitFor(function () {
    return allTabsPopup.getNode().state == 'closed';
  }, "The all tabs popup should have been closed");
}
