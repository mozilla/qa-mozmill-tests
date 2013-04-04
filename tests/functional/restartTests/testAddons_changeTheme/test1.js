/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../../data/");
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

const THEME = [
  {name: "Theme (Plain)",
   id: "plain.theme@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + "addons/install.html?addon=themes/plain.jar"},
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
  addons.setDiscoveryPaneURL(LOCAL_TEST_PAGE);

  prefs.preferences.setPref(PREF_UPDATE_EXTENSION, false);

  // Set pref for add-on installation dialog timer
  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  // Whitelist add the local test folder
  addons.addToWhiteList(LOCAL_TEST_FOLDER);

  // Store the theme in the persisted object
  persisted.theme = THEME;

  tabs.closeAllTabs(controller);
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

  // Restart the browser using restart prompt
  var restartLink = addonsManager.getElement({type: "listView_restartLink",
                                              parent: plainTheme});

  controller.startUserShutdown(TIMEOUT_USER_SHUTDOWN, true);
  controller.click(restartLink);
}
