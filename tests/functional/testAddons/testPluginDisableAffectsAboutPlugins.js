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
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Remus Pop <remus.pop@softvision.ro> (original author)
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
var addons = require("../../../lib/addons");
var {assert, expect} = require("../../../lib/assertions");
var domUtils = require("../../../lib/dom-utils");
var tabs = require("../../../lib/tabs");

function setupModule() {
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);

  // Skip test if we don't have enabled plugins
  if (controller.window.navigator.plugins.length < 1) {
    testEnableDisablePlugin.__force_skip__ = "No enabled plugins detected";
    teardownModule.__force_skip__ = "No enabled plugins detected";
  } else {
    persisted.plugin = controller.window.navigator.plugins[0];
  }

  addonsManager = new addons.AddonsManager(controller);
  tabs.closeAllTabs(controller);
  
}

function teardownModule() {
  // Enable the plugin that was disabled
  addons.enableAddon(persisted.plugin.node.mAddon.id);

  delete persisted.plugin;
}

/**
 * Tests disabling a plugin is affecting about:plugins 
 */
function testDisableEnablePlugin() {
  addonsManager.open();

  // Select the Plugins category
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "plugin"})
  });

  persisted.plugin = addonsManager.getAddons({attribute: "name", value: persisted.plugin.name})[0];

  // Check that the plugin is listed on the about:plugins page
  assert.ok(pluginExistsInAboutPlugins(), persisted.plugin.name + " is listed on the about:plugins page");

  // Disable the plugin
  tabBrowser.selectedIndex = 1;
  addonsManager.disableAddon({addon: persisted.plugin});

  // Check that the plugin is disabled
  assert.equal(persisted.plugin.getNode().getAttribute("active"), "false", persisted.plugin.name + " has been disabled");

  // Check that the plugin disappeared from about:plugins
  expect.ok(!pluginExistsInAboutPlugins(), persisted.plugin.name + " does not appear in about:plugins");

  //Enable the plugin
  tabBrowser.selectedIndex = 1;
  addonsManager.enableAddon({addon: persisted.plugin});

  // Check that the plugin is enabled
  assert.ok(persisted.plugin.getNode().getAttribute("active"), persisted.plugin.name + " has been enabled");

  // Check that the plugin appears in about:plugins
  expect.ok(pluginExistsInAboutPlugins(), persisted.plugin.name + " appears in about:plugins");
}

/**
 * Checks that the plugin appears in about:plugins
 *
 * @returns {boolean} True if the plugin appears in about:plugins
 */
function pluginExistsInAboutPlugins() {
  tabBrowser.selectedIndex = 0;
  controller.open("about:plugins");
  controller.waitForPageLoad();

  var exists = false;
  var nodeCollector = new domUtils.nodeCollector(controller.tabs.activeTab);
  pluginNames = nodeCollector.queryNodes(".plugname").elements;

  for (var i = 0; i < pluginNames.length; i++) {
    if (pluginNames[i].getNode().textContent === persisted.plugin.node.mAddon.name) {
      exists = true;
      break;
    }
  }

  return exists;
}
