/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var blocklist = require("../ui/addons_blocklist");

var addons = require("../addons");
var {assert, expect} = require("../../../lib/assertions");
var modalDialog = require("../modal-dialog");
var prefs = require("../prefs");
var tabs = require("../tabs");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = BASE_URL + "addons/blocklist/mixedblock_extension/blocklist.xml";

const ADDONS = [
  {name : "Restartless Addon",
   url  : BASE_URL + "addons/extensions/restartless.xpi"},
  {name : "Inline Settings (Restartless)",
   url  : BASE_URL + "addons/extensions/restartless_inlinesettings.xpi"}
];

const PREF_BLOCKLIST = "extensions.blocklist.url";
const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";

const INSTALL_DIALOG_DELAY = 250;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);
  blocklistWindow = new blocklist.BlocklistWindow();

  prefs.preferences.setPref(PREF_BLOCKLIST, TEST_DATA);
  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  tabs.closeAllTabs(controller);
}

function testBlocklistAPI() {
  ADDONS.forEach(function (addon) {
    var md = new modalDialog.modalDialog(addonsManager.controller.window);
    md.start(addons.handleInstallAddonDialog);
    controller.open(addon.url);
    md.waitForDialog();
  });

  blocklistWindow.open();

  var addonList = blocklistWindow.getElements({type: "addonList"});
  assert.notEqual(addonList.length, 0, "There is at least one addon blocked");

  var bothMessage = blocklistWindow.getElement({type: "bothMessage"});
  expect.ok(bothMessage.getNode(), "Message for blocked addons list is displayed");

  var hardBlockedMessage = blocklistWindow.getElement({type: "hardBlockedMessage"});
  expect.ok(hardBlockedMessage.getNode(), "Expected the hard blocked message");

  var softBlockedMessage = blocklistWindow.getElement({type: "softBlockedMessage"});
  expect.ok(softBlockedMessage.getNode(), "Expected the soft blocked message");

  var hardBlockedAddon = blocklistWindow.getElement({type: "hardBlockedAddon"});
  expect.ok(hardBlockedAddon.getNode(), "Expected the addon to be hard blocked");

  // Verify the name of the hardblocked addon
  expect.equal(hardBlockedAddon.getNode().getAttribute("name"), ADDONS[1].name,
               "Addon name should be identical");

  var softBlockedAddon = blocklistWindow.getElement({type: "softBlockedAddon"});
  expect.ok(softBlockedAddon.getNode(), "Expected the addon to be soft blocked");

  // Verify the name of the softblocked addon
  expect.equal(softBlockedAddon.getNode().getAttribute("name"), ADDONS[0].name,
               "Addon name should be identical");

  var moreInfo = blocklistWindow.getElement({type: "moreInfo"});
  expect.ok(moreInfo.getNode(), "More information link is present");
}

function teardownModule() {
  prefs.preferences.clearUserPref(PREF_BLOCKLIST);
  prefs.preferences.clearUserPref(PREF_INSTALL_DIALOG);
}
