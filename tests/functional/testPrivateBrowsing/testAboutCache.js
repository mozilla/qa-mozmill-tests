/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { assert, expect } = require("../../../lib/assertions");
var privateBrowsing = require("../../../lib/ui/private-browsing");
var tabs = require("../../../lib/tabs");

const TEST_DOMAINS = ["http://domain1.mozqa.com",
                      "http://domain2.mozqa.com"];

function setupModule() {
  controller = mozmill.getBrowserController();
  pbWindow = new privateBrowsing.PrivateBrowsingWindow();

  // Clear cache
  Services.cache.evictEntries(Ci.nsICache.STORE_ANYWHERE);

  tabs.closeAllTabs(controller);
}

function teardownModule() {
  pbWindow.close();
}

/**
 * Test to check caching in Private Browsing
 */
function testPrivateBrowsingCache() {
  var diskEntriesCount, memoryEntriesCount, diskEntry, memoryEntry,
      diskEntries = [], memoryEntries = [];

  var visitor = {
    visitDevice: function (aDeviceID, aDeviceInfo) {
      if (aDeviceID === "disk") {
        diskEntriesCount = aDeviceInfo.entryCount;
      }
      else if (aDeviceID === "memory") {
        memoryEntriesCount = aDeviceInfo.entryCount;
      }
      return true;
    },

    visitEntry: function (aDeviceID, aEntryInfo) {
      if (aDeviceID === "disk") {
        diskEntry = aEntryInfo.key;
        diskEntries.push(diskEntry);
      }
      else if (aDeviceID === "memory") {
        memoryEntry = aEntryInfo.key;
        memoryEntries.push(memoryEntry);
      }
      return true;
    }
  }

  // Get entries information for both disk and memory devices
  Services.cache.visitEntries(visitor);
  assert.equal(diskEntriesCount, 0, "Disk cache has no entries");

  pbWindow.open(controller);

  TEST_DOMAINS.forEach(function (aPage) {
    pbWindow.controller.open(aPage);
    pbWindow.controller.waitForPageLoad();
  });

  Services.cache.visitEntries(visitor);
  TEST_DOMAINS.forEach(function (aPage) {
    expect.ok(diskEntries.indexOf(aPage) === -1,
              "Visited page " + aPage + " is not present in PB disk cache entries");
  });

  pbWindow.close();

  Services.cache.visitEntries(visitor);
  expect.equal(memoryEntriesCount, 0, "Memory cache has no entries after PB mode");
  TEST_DOMAINS.forEach(function (aPage) {
    assert.ok(diskEntries.indexOf(aPage) === -1,
              "Page " + aPage + " visited in PB is not present in disk cache entries");
  });
}
