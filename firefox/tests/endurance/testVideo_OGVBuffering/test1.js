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
const VIDEO_LENGTH = 59;

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
    enduranceManager.addCheckpoint("Load a web page with HTML5 Video");
    controller.open(TEST_DATA);
    controller.waitForPageLoad();

    enduranceManager.addCheckpoint("Video is set to autoplay and " +
                                   "skip field set to 5 seconds");
    var currentTime = new elementslib.ID(controller.window.document, "currentTime");
    var movie = new elementslib.ID(controller.window.document, "movie");
    var playButton = new elementslib.ID(controller.window.document, "play");
    var seekButton = new elementslib.ID(controller.window.document, "seek");
    var skipField = new elementslib.ID(controller.window.document, "skipField");
    var skipButton = new elementslib.ID(controller.window.document, "skip");

    skipField.getNode().value = SKIP_VALUE;
    controller.click(playButton);

    enduranceManager.loop(function () {
      enduranceManager.addCheckpoint("Skip through the video using the UI ");
      // If the video has reached the end go back to start
      if (currentTime.getNode().value >= VIDEO_LENGTH) {
        controller.click(seekButton);
      }
      else {
        controller.click(skipButton);
      }
      // We wait for the video to start playing again before skipping
      assert.waitFor( function () {
        return movie.getNode().readyState == 4;
      }, "Video did not finish loading after skip in time");
    });
  });
}
