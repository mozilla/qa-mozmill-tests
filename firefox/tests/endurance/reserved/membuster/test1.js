/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var endurance = require("../../../../../lib/endurance");
var modalDialog = require("../../../../../lib/modal-dialog");
var prefs = require("../../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const TEST_SITES = ["facebook.com", "youtube.com", "imdb.com", "bbc.co.uk", "cnn.com", "livejournal.com",
                    "paypal.com", "finance.yahoo.com", "alibaba.com", "espn.go.com", "bankofamerica.com", "skype.com",
                    "google.com", "yahoo.com", "mail.google.com", "blogger.com", "en.wikipedia.org", "mail.yahoo.com",
                    "ign.com", "gamespot.com", "miniclip.com", "pogo.com", "battle.net", "games.yahoo.com",
                    "nih.gov", "webmd.com", "ncbi.nlm.nih.gov/pubmed/", "focusoncrohnsdisease.com", "mercola.com", "mayoclinic.com",
                    "ehow.com", "yelp.com", "groupon.com", "google.com/products", "opendns.com", "engadget.com",
                    "thesaurus.com", "w3schools.com", "weebly.com", "xe.com/ucc/", "espncricinfo.com", "timeanddate.com",
                    "news.yahoo.com", "nytimes.com", "huffingtonpost.com", "bbc.co.uk/news/", "news.google.com", "weather.com",
                    "booking.com", "tripadvisor.com", "metacafe.com", "expedia.com", "xe.com", "cracked.com",
                    "answers.yahoo.com", "maps.google.com", "stumbleupon.com", "stackoverflow.com", "archive.org", "wiki.answers.com",
                    "google.co.in", "amazon.com", "google.co.uk", "microsoft.com", "apple.com", "aol.com",
                    "yahoo.co.jp", "translate.google.com", "ncbi.nlm.nih.gov", "urbandictionary.com", "news.cnet.com", "howstuffworks.com",
                    "ebay.com", "netflix.com", "amazon.co.uk", "walmart.com", "target.com", "ikea.com",
                    "deviantart.com", "digg.com", "omg.yahoo.com", "shine.yahoo.com", "match.com", "plentyoffish.com",
                    "sports.yahoo.com", "sports.yahoo.com/mlb/", "mlb.mlb.com", "goal.com", "sports.yahoo.com/nba/", "nba.com"];

const TAB_MODAL = "prompts.tab_modal.enabled";

const NUM_TABS =  30;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);

  // Bug 673399
  // Tab modal dialogs are not yet supported so we switch back to browser modal dialogs
  prefs.setPref(TAB_MODAL, false);

  aModule.md = new modalDialog.modalDialog(aModule.controller.window);
  aModule.md.start(closeModalDialog);

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.tabBrowser.closeAllTabs();
}

/**
 * Run Mem Buster
 **/
function testMemBuster() {
  enduranceManager.run(function () {
    enduranceManager.loop(function () {
      var currentEntity = enduranceManager.currentEntity;

      if (currentEntity > 1) {
        if (tabBrowser.length < NUM_TABS) {
          tabBrowser.openTab();
        }
        else {
          var tabNum = currentEntity % NUM_TABS;
          controller.tabs.selectTabIndex(tabNum - 1);
        }
      }

      var siteIndex = (currentEntity - 1) % TEST_SITES.length;
      var site = TEST_SITES[siteIndex];

      controller.open(site);
      enduranceManager.addCheckpoint("opening " + site);
    });
    tabBrowser.closeAllTabs();
  });
}

function closeModalDialog(aController) {
  aController.window.close();
  md.start(closeModalDialog);
}

function teardownModule(aModule) {
  aModule.md.stop();
  aModule.tabBrowser.closeAllTabs();
}
