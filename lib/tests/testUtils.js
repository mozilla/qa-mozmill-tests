/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var utils = require("../utils");

const TEST_DATA = {
  urls: [
    "chrome://browser/locale/pageInfo.properties",
    "chrome://browser/locale/browser.properties",
    "chrome://global/locale/search/search.properties"
  ],
  properties: [
    "securityNoOwner",
    "geolocation.shareLocation",
    "addEngineConfirmTitle"
  ],
  invalidProp: "invalidPropName"
}

function testUtils() {
  TEST_DATA.properties.forEach(aProp => {
    var prop = utils.getProperty(TEST_DATA.urls, aProp);
    expect.ok(prop, "Property has been found");
  });

  expect.throws(() => {
    var prop = utils.getProperty(TEST_DATA.urls, TEST_DATA.invalidProp);
  }, undefined, "Invalid property has not raised an exception");
}
