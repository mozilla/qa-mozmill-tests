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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@mozilla.com>
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

/**
 * Litmus test #8240 - Manage search engine (Remove)
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['SearchAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();
  search = new SearchAPI.searchEngine(controller);
}

var teardownModule = function(module)
{
  search.restoreDefaultEngines();
}

/**
 * Manage search engine (Remove)
 */
var testRemoveEngine = function()
{
  // We have to open the popup to update the list of engines
  search.clickEngineButton();

  // Get the name of the 2nd engine we want to remove
  var engine = new elementslib.Lookup(controller.window.document,
                                      SearchAPI.searchEnginePopup +
                                      '/[1]');
  var name = engine.getNode().label;

  // Close the popup
  search.clickEngineButton();

  // Remove the 2nd engine in the list
  search.openManager(handleEngines);

  // Check that the 2nd engine isn't listed anymore
  search.clickEngineButton();

  engine = new elementslib.Lookup(controller.window.document,
                                      SearchAPI.searchEnginePopup +
                                      '/anon({"title":"' + name + '"})');
  controller.assertNodeNotExist(engine);

  // Close the popup
  search.clickEngineButton();
}

/**
 * Remove a search engine from the list of available search engines
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var handleEngines = function(controller)
{
  var engineList = controller.window.document.getElementById("engineList");

  // Wait until the view has been created
  controller.waitForEval("subject.view != undefined", gTimeout, 100,
                         engineList);

  // Select the 2nd search engine and remove it
  engineList.view.selection.select(1);
  controller.click(new elementslib.ID(controller.window.document, "remove"));
  controller.sleep(gDelay);

  var okButton = new elementslib.Lookup(controller.window.document, '/id("engineManager")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  controller.click(okButton);
}
