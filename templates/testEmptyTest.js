/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include this if opening relocatable, potentially remotely located files
const BASE_URL = collector.addHttpResource("../data/");
const TEST_DATA = BASE_URL + "path/file.html";

// Include this if opening external urls
// const TEST_DATA = "http://www.external.url/path/file.html";

// Include this only if specifying a timeout other than 5000ms
const TEST_EXAMPLE_TIMEOUT = 3000;

// Setup for the test
var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

// Run the test
var testSampleTestcase = function() {

}
