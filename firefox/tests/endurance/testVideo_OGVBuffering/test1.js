/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var endurance = require("../../../lib/endurance");
var tabs = require("../../../lib/tabs");

const TEST_DATA = "http://www.mozqa.com/data/firefox/video/" +
                  "test_ogv_video_60s.html";

const SKIP_VALUE = 5;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();
}

function testVideo_OGVBuffering() {
  enduranceManager.run(function () {
    // Clearing the cache between iterations
    var cs = Cc["@mozilla.org/network/cache-service;1"].
             getService(Ci.nsICacheService);
    cs.evictEntries(Ci.nsICache.STORE_ANYWHERE);

    enduranceManager.addCheckpoint("Load a web page with HTML5 Video");
    controller.open(TEST_DATA);
    controller.waitForPageLoad();

    var movie = new elementslib.ID(controller.window.document, "movie");
    var playButton = new elementslib.ID(controller.window.document, "play");
    var skipField = new elementslib.ID(controller.window.document, "skipField");
    var skipButton = new elementslib.ID(controller.window.document, "skip");

    // We wait for the video to be available before playing
    assert.waitFor(function () {
      return movie.getNode().readyState === movie.getNode().HAVE_ENOUGH_DATA;
    }, "Video data is available");

    enduranceManager.addCheckpoint("Video is ready to play");
    controller.click(playButton);

    skipField.getNode().value = SKIP_VALUE;
    controller.click(skipButton);

    // We wait for the video to start playing again
    assert.waitFor(function () {
      return movie.getNode().readyState === movie.getNode().HAVE_ENOUGH_DATA;
    }, "Video has loaded and skipped to the expected timeframe");
    enduranceManager.addCheckpoint("Video has started playing");
  });
}
