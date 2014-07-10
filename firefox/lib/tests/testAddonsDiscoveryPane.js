/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var Addons = require("../../../lib/addons");
var {expect} = require("../../../lib/assertions");


function setupModule() {
  controller = mozmill.getBrowserController();
  am = new Addons.AddonsManager(controller);
}

function testAddonsAPI() {
  am.open();

  // Select the Get Add-ons pane
  am.setCategory({category: am.getCategoryById({id: "discover"})});
  var discovery = am.discoveryPane;
  discovery.waitForPageLoad();

  expect.equal(discovery.getSections().length, 6,
               "There have to be 6 different sections");

  var section = discovery.getSection("main-feature");
  expect.equal(section.getNode().id, "main-feature",
               "The main-feature section is selected");

  // Tests for the collection
  var nextLink = discovery.getElement({type: "mainFeature_nextLink", parent: section});
  var prevLink = discovery.getElement({type: "mainFeature_prevLink", parent: section});

  discovery.controller.click(nextLink);
  discovery.controller.sleep(200);
  discovery.controller.click(prevLink);
  discovery.controller.sleep(200);

  // Tests for recommended add-ons
  section = discovery.getSection("recs");
  var elems = discovery.getElements({type: "recommendedAddons_addons", parent: section});

  // Tests for featured add-ons
  section = discovery.getSection("featured-addons");
  var addons = discovery.getElements({type: "featuredAddons_addons", parent: section});

  expect.notEqual(addons.length, 0, "Add-ons have been found");

  // Tests for featured persona
  section = discovery.getSection("featured-personas");
  var persona = discovery.getElements({type: "featuredPersonas_addons", parent: section});

  expect.notEqual(persona.length, 0, "Personas have been found");

  // Tests for more ways
  section = discovery.getSection("more-ways");
  var moreThemes = discovery.getElements({type: "moreWays_browseThemes", parent: section});

  // Tests for up and coming
  section = discovery.getSection("up-and-coming");
  var all = discovery.getElement({type: "upAndComing_seeAllLink", parent: section});
  var addons = discovery.getElements({type: "upAndComing_addons", parent: section});

  discovery.controller.click(addons[0]);
  discovery.waitForPageLoad();

  var button = discovery.getElement({type: "addon_backLink"});
  discovery.controller.click(button);

  am.close();
}
