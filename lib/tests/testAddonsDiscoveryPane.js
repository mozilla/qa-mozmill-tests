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
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <mail@hskupin.info>
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

// Include required modules
var Addons = require("../addons");


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

  controller.assert(function () {
    return discovery.getSections().length === 6;
  }, "There have to be 6 different sections - got '" +
     discovery.getSections.length + "', expected '6'.");

  var section = discovery.getSection("main-feature");
  discovery.controller.assertJSProperty(section, "id", "main-feature");

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

  controller.assert(function () {
    return addons.length > 0;
  }, "Add-ons have been found - got '" + addons.length + "'.");

  // Tests for featured persona
  section = discovery.getSection("featured-personas");
  var persona = discovery.getElements({type: "featuredPersonas_addons", parent: section});

  controller.assert(function () {
    return persona.length > 0;
  }, "Personas have been found - got '" + addons.length + "'.");

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
