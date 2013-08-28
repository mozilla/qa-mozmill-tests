/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

const THEME = [
  {name: "Theme (Plain)",
   id: "plain.theme@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=themes/plain.jar"},
  {name: "Default",
   id: "{972ce4c6-7e08-4474-a285-3208198ce6fd}"}
];

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_UPDATE_EXTENSION = "extensions.update.enabled";
const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;
const TIMEOUT_USER_SHUTDOWN = 2000;

function setupModule() {
  controller = mozmill.getBrowserController();

  addonsManager = new addons.AddonsManager(controller);
  addons.setDiscoveryPaneURL(TEST_DATA);

  prefs.preferences.setPref(PREF_UPDATE_EXTENSION, false);

  // Set pref for add-on installation dialog timer
  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  // Whitelist add the local test folder
  addons.addToWhiteList(BASE_URL);

  // Store the theme in the persisted object
  persisted.theme = THEME;

  installedAddon = null;

  tabs.closeAllTabs(controller);
}

function teardownModule(aModule) {
  // Bug 886811
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // startUserShutdown is broken in mozmill-2.0
  if ("restartApplication" in aModule.controller) {
    aModule.controller.restartApplication();
  }
  else {
    // Restart the browser using restart prompt
    var restartLink = aModule.addonsManager.getElement({type: "listView_restartLink",
                                                        parent: aModule.installedAddon});
    aModule.controller.startUserShutdown(TIMEOUT_USER_SHUTDOWN, true);
    aModule.controller.click(restartLink);
  }
}

/**
 * Test installing a theme
 */
function testInstallTheme() {
  // Go to theme url and perform install
  controller.open(persisted.theme[0].url);
  controller.waitForPageLoad();

  var installLink = new elementslib.Selector(controller.tabs.activeTab,
                                             "#addon");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  md.start(addons.handleInstallAddonDialog);
  controller.click(installLink);
  md.waitForDialog(TIMEOUT_DOWNLOAD);

  addonsManager.open();

  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  var plainTheme = addonsManager.getAddons({attribute: "value",
                                            value: persisted.theme[0].id})[0];

  // Verify that plain-theme is marked to be enabled
  assert.equal(plainTheme.getNode().getAttribute("pending"), "enable");

  // We need access to this addon in teardownModule
  installedAddon = plainTheme;
}
