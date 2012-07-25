/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { expect } = require("../../../lib/assertions");
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla.html', id: 'community'},
  {url: 'about:', id: 'aboutPageList'}
];

function setupModule() {
  controller = mozmill.getBrowserController();
  modifier = controller.window.document.documentElement.
             getAttribute("titlemodifier_privatebrowsing");

  // Create Private Browsing instance and set handler
  pb = new privateBrowsing.privateBrowsing(controller);
  pb.handler = pbStartHandler;

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

function teardownModule() {
  pb.reset();
}

/**
 * Start and Stop Private Browsing Mode
 */
function testStartStopPrivateBrowsingMode() {
  // Make sure we are not in PB mode and show a prompt
  pb.enabled = false;
  pb.showPrompt = true;

  // Open local pages in separate tabs and wait for each to finish loading
  LOCAL_TEST_PAGES.forEach(function(page) {
    controller.open(page.url);
    controller.waitForPageLoad();
    
    var elem = new elementslib.ID(controller.tabs.activeTab, page.id);
    controller.assertNode(elem);
    
    tabBrowser.openTab();
  });

  // Start the Private Browsing mode
  pb.start();

  expect.equal(controller.tabs.length, 1, "Only one tab is open");

  expect.contain(controller.window.document.title, modifier,
                 "Title modifier has been set");

  // Check descriptions on the about:privatebrowsing page
  var description = utils.getEntity(pb.getDtds(), "privatebrowsingpage.description");
  var learnMore = utils.getEntity(pb.getDtds(), "privatebrowsingpage.learnMore");
  var longDescElem = new elementslib.ID(controller.tabs.activeTab, "errorLongDescText");
  var moreInfoElem = new elementslib.ID(controller.tabs.activeTab, "moreInfoLink");
  controller.waitForElement(longDescElem, TIMEOUT);  
  controller.assertText(longDescElem, description);
  controller.assertText(moreInfoElem, learnMore);

  // Stop Private Browsing mode
  pb.stop();

  expect.equal(controller.tabs.length, (LOCAL_TEST_PAGES.length + 1),
               "All tabs have been restored");

  for (var i = 0; i < LOCAL_TEST_PAGES.length; i++) {
    controller.waitForPageLoad(controller.tabs.getTab(i));

    // waitForElement is used on exit of PB mode because pages are loaded from bfcache 
    var elem = new elementslib.ID(controller.tabs.getTab(i), LOCAL_TEST_PAGES[i].id);
    controller.waitForElement(elem);
    controller.assertNode(elem);
  }

  expect.notContain(controller.window.document.title, modifier,
                    "Title modifier has not been set");
}

/**
 * Handle the modal dialog to enter the Private Browsing mode
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function pbStartHandler(controller) {
  // Check to not ask anymore for entering Private Browsing mode
  var checkbox = new elementslib.ID(controller.window.document, 'checkbox');
  controller.waitThenClick(checkbox, TIMEOUT);

  var okButton = new elementslib.Lookup(controller.window.document, 
                                        '/id("commonDialog")' +
                                        '/anon({"anonid":"buttons"})' +
                                        '/{"dlgtype":"accept"}');
  controller.click(okButton);
}

