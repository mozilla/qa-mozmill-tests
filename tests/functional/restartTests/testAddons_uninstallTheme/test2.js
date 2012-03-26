/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
}

/**
 * Test theme has been installed then uninstall
 */
function testThemeIsInstalled() {
  addonsManager.open();

  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  // Verify the theme is installed
  var theme = addonsManager.getAddons({attribute: "value", value: persisted.theme.id})[0];
  var themeIsInstalled = addonsManager.isAddonInstalled({addon: theme});

  assert.ok(themeIsInstalled, persisted.theme.id + " is installed");

  // Remove theme
  addonsManager.removeAddon({addon: theme});
}

// Bug 719971 - Failure in testAddons_uninstallTheme | Modal dialog has been found and processed
setupModule.__force_skip__ = "Bug 719971 - Failure in testAddons_uninstallTheme " +
                             "| Modal dialog has been found and processed";
