/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var utils = require("../utils");

const TEST_DATA = {
  properties: {
    urls: [
      "chrome://browser/locale/pageInfo.properties",
      "chrome://browser/locale/browser.properties",
      "chrome://global/locale/search/search.properties"
    ],
    ids: [
      "securityNoOwner",
      "geolocation.shareLocation",
      "addEngineConfirmTitle"
    ],
    invalidProp: "invalidPropName"
  },
  dtds: {
    urls: [
      "chrome://browser/locale/browser.dtd",
      "chrome://global/locale/global.dtd",
      "chrome://mozapps/locale/downloads/downloads.dtd"
    ],
    ids: [
      "appmenu.tooltip",
      "locale.dir",
      "starting.label"
    ],
    invalidEntity: "invalidEntityID"
  }
}

function testUtils() {
  TEST_DATA.properties.ids.forEach(aProp => {
    var prop = utils.getProperty(TEST_DATA.properties.urls, aProp);
    expect.ok(prop, "Property has been found");
  });

  expect.throws(() => {
    var prop = utils.getProperty(TEST_DATA.properties.urls, TEST_DATA.properties.invalidProp);
  }, undefined, "Non-existent property has not been found");

  // Test getProperty with single string
  var prop = utils.getProperty(TEST_DATA.properties.urls[0], TEST_DATA.properties.ids[0]);
  expect.ok(prop, "Property has been found");

  TEST_DATA.dtds.ids.forEach(aEntity => {
    var entity = utils.getEntity(TEST_DATA.dtds.urls, aEntity);
    expect.ok(entity, "Entity has been found");
  });

  expect.throws(() => {
    var entity = utils.getEntity(TEST_DATA.dtds.urls, TEST_DATA.dtds.invalidEntity);
  }, undefined, "Non-existent entity has not been found");

  // Test getEntity with a single string
  var entity = utils.getEntity(TEST_DATA.dtds.urls[0], TEST_DATA.dtds.ids[0]);
  expect.ok(entity, "Entity has been found");
}
