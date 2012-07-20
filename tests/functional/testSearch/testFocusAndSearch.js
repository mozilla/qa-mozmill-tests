/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var search = require("../../../lib/search");

const gDelay = 0;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);
}

var teardownTest = function()
{
  searchBar.clear();
}

/**
 * Use the mouse to focus the search bar and start a search
 */
var testClickAndSearch = function()
{
  searchBar.focus({type: "click"});
  searchBar.search({text: "Firefox", action: "returnKey"});
}

/**
 * Use the keyboard shortcut to focus the search bar and start a search
 */
var testShortcutAndSearch = function()
{
  searchBar.focus({type: "shortcut"});
  searchBar.search({text: "Mozilla", action: "goButton"});
}

/**
 * Map test functions to litmus tests
 */
// testClickAndSearch.meta = {litmusids : [8241]};
// testShortcutAndSearch.meta = {litmusids : [8242]};
