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
 *   Henrik Skupin <mail@hskupin.info> (Original Author)
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

  collector.queryAnonymousNodes("anonid", "input");
  expect.equal(collector.nodes.length, 1, "The input element of the url has been found.");
}
