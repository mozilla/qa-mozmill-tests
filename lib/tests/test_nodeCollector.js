/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var {assert, expect} = require("../assertions");
var {nodeCollector} = require("../dom-utils");


function setupModule(aModule) {
  controller = mozmill.getBrowserController();
}


/**
 * Tests for nodeCollector
 */
function testNodeCollector() {
  var collector = new nodeCollector(controller.window);

  collector.queryNodes("#home-butto");
  expect.equal(collector.nodes.length, 0, "Node with a wrong id cannot be found.");

  collector.queryNodes("#urlbar");
  assert.equal(collector.nodes.length, 1, "The urlbar has been found.");

  collector.root = collector.nodes[0];
  collector.queryNodes("toolbarbutton");
  expect.notEqual(collector.nodes.length, 0, "Sub nodes of the urlbar have been found.");

  collector.filterByCSSProperty("visibility", "visible");
  expect.equal(collector.nodes.length, 1, "One of the sub nodes has been filtered by the CSS property.");

  collector.queryNodes("toolbarbutton");
  collector.filterByDOMProperty("id", "urlbar-go-button");
  expect.equal(collector.nodes.length, 1, "One of the sub nodes has been filtered by the DOM property.");

  collector.queryNodes("toolbarbutton");
  collector.filterByJSProperty("id", "urlbar-go-button");
  expect.equal(collector.nodes.length, 1, "One of the sub nodes has been filtered by the JS property.");

  collector.queryNodes("#navigator-toolbox");
  expect.equal(collector.nodes.length, 0, "A parent node of the root cannot be found.");

  collector.queryAnonymousNode("anonid", "input");
  expect.equal(collector.nodes.length, 1, "The input element of the url has been found.");
}
