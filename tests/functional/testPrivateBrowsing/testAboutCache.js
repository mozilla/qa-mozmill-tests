/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { assert, expect } = require("../../../lib/assertions");
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");

const TEST_DOMAINS = ["http://domain1.mozqa.com",
                      "http://domain2.mozqa.com"];

function setupModule() {
  controller = mozmill.getBrowserController();
  pb = new privateBrowsing.privateBrowsing(controller);

  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Clear cache
  cs = Cc["@mozilla.org/network/cache-service;1"].
       getService(Ci.nsICacheService);
  cs.evictEntries(Ci.nsICache.STORE_ANYWHERE);

  tabs.closeAllTabs(controller);
}

function teardownModule() {
  pb.reset();
}

/**
 * Test to check caching in Private Browsing
 */
function testPrivateBrowsingCache() {
  var diskEntriesCount, memoryEntriesCount, diskSize, diskEntry, memoryEntry,
      diskEntries = [], memoryEntries = [];

  var visitor = {
    visitDevice: function (aDeviceID, aDeviceInfo) {
      if (aDeviceID === "disk") {
        diskEntriesCount = aDeviceInfo.entryCount;
        diskSize = aDeviceInfo.totalSize;
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
  cs.visitEntries(visitor);

  assert.equal(diskEntriesCount, 0, "Disk cache has no entries");
  assert.equal(diskSize, 0, "There is no disk storage in use");

  pb.start();

  TEST_DOMAINS.forEach(function (aPage) {
    controller.open(aPage);
    controller.waitForPageLoad();
  });

  cs.visitEntries(visitor);
  TEST_DOMAINS.forEach(function (aPage) {
    expect.ok(diskEntries.indexOf(aPage) === -1,
              "Visited page " + aPage + " is not present in PB disk cache entries");
  });

  expect.notEqual(memoryEntriesCount, 0, "Memory cache contains entries in PB");

  pb.stop();

  cs.visitEntries(visitor);
  assert.equal(memoryEntriesCount, 0, "Memory cache has no entries after PB mode");

  TEST_DOMAINS.forEach(function (aPage) {
    assert.ok(diskEntries.indexOf(aPage) === -1,
              "Page " + aPage + " visited in PB is not present in disk cache entries");
  });
}

