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
 * The Original Code is Mozmill Test code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Dave Hunt <dhunt@mozilla.com> (Original Author)
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

var endurance = require("../../../../lib/endurance");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
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

function setupModule() {
  controller = mozmill.getBrowserController();
  enduranceManager = new endurance.EnduranceManager(controller);

  // XXX: Bug 673399
  //      Tab modal dialogs are not yet supported so we switch back to browser modal dialogs
  prefs.preferences.setPref(TAB_MODAL, false);

  md = new modalDialog.modalDialog(controller.window);
  md.start(closeModalDialog);

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
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

function closeModalDialog(controller) {
  controller.window.close();
  md.start(closeModalDialog);
}

function teardownModule() {
  md.stop();
  tabBrowser.closeAllTabs();
}
