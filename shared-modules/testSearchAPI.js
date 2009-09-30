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
 * @fileoverview
 * The SearchAPI adds support for search related functions like the search bar.
 *
 * @version 1.0.1
 */

var MODULE_NAME = 'SearchAPI';

const searchEngineButton = '/id("main-window")/id("navigator-toolbox")/id("nav-bar")/' +
                           'id("search-container")/id("searchbar")/anon({"anonid":"searchbar-textbox"})/' +
                           'anon({"anonid":"searchbar-engine-button"})';
const searchEnginePopup = searchEngineButton + '/anon({"anonid":"searchbar-popup"})';
const searchEngineInput = '/id("main-window")/id("navigator-toolbox")/id("nav-bar")/' +
                          'id("search-container")/id("searchbar")/anon({"anonid":"searchbar-textbox"})/' +
                          'anon({"class":"autocomplete-textbox-container"})/' +
                          'anon({"anonid":"textbox-input-box"})/anon({"anonid":"input"})';

const gTimeout = 5000;

/**
 * Constructor
 *
 * @param {MozMillController} controller
 *        MozMillController of the browser window to operate on
 */
function searchEngine(controller)
{
  this._bss = Cc["@mozilla.org/browser/search-service;1"]
                 .getService(Ci.nsIBrowserSearchService);

  this._controller = controller;
}

/**
 * Search Manager class
 */
searchEngine.prototype = {
  /**
   * Get the controller of the associated browser window
   *
   * @returns Controller of the browser window
   * @type MozMillController
   */
  get controller()
  {
    return this._controller;
  },

  /**
   * Clear the search field
   */
  clear : function searchengine_clear()
  {
    var activeElement = this._controller.window.document.activeElement;

    var searchInput = new elementslib.Lookup(this._controller.window.document, searchEngineInput);
    this._controller.keypress(searchInput, 'a', {accelKey: true});
    this._controller.keypress(searchInput, 'VK_DELETE', {});

    if (activeElement)
      activeElement.focus();
  },

  /**
   * Focus the search bar text field
   *
   * @param {boolean} useMouse
   *        If true use the mouse to focus the text field otherwise the shortcut
   */
  focus : function searchengine_focus(useMouse)
  {
    var searchInput = new elementslib.Lookup(this._controller.window.document, searchEngineInput);

    if (useMouse) {
      // The engine button overlays the textbox so click 10px behind the button
      this._controller.click(searchInput);
    } else {
      this._controller.keypress(null, 'k', {accelKey: true});
    }

    // Check if the search bar has the focus
    var activeElement = this._controller.window.document.activeElement;
    this._controller.assertJS(searchInput.getNode() == activeElement);
  },

  /**
   * Check if a search engine is installed
   *
   * @param {string} name
   *        Name of the search engine to check
   */
  isInstalled : function searchengine_isInstalled(name)
  {
    var engine = this._bss.getEngineByName(name);
    return (engine != null);
  },

  /**
   * Check if a search engine is selected
   *
   * @param {string} name
   *        Name of the search engine to check
   */
  isSelected : function searchengine_isSelected(name)
  {
    var selectedEntry = new elementslib.Lookup(this._controller.window.document,
                                               searchEnginePopup + '/anon({"selected":"true"})');
    return name == selectedEntry.getNode().label;
  },

  /**
   * Remove the search engine with the given name
   *
   * @param {string} name
   *        Name of the search engine to remove
   */
  remove : function searchengine_remove(name)
  {
    var engine = this._bss.getEngineByName(name);
    this._bss.removeEngine(engine);
  },

  /**
   * Start a search with the given search term and check if the resulting URL
   * contains the search term.
   *
   * @param {string} searchTerm
   *        Text which should be searched for
   */
  search : function searchengine_search(searchTerm)
  {
    var searchBar = new elementslib.ID(this._controller.window.document, 'searchbar');
    var locationBar = new elementslib.ID(this._controller.window.document, 'urlbar');

    // Enter search term in text field
    this._controller.type(searchBar, searchTerm);

    // Start the search by pressing return
    this._controller.keypress(searchBar, 'VK_RETURN', {});
    this._controller.waitForPageLoad();

    // Retrieve the URL which is used for the currently selected search engine
    var targetURL = this._bss.currentEngine.getSubmission(searchTerm, null).uri;

    // Check if pure domain names are identical
    var domainName = targetURL.host.replace(/.+\.(\w+)\.\w+$/gi, "$1");
    if(locationBar.getNode().value.indexOf(domainName) == -1)
      throw "Expected domain name doesn't match the current one"

    // Check if search term is listed in URL
    if(locationBar.getNode().value.indexOf(searchTerm) == -1)
      throw "Search term in URL expected but not found.";
  },

  /**
   * Select the search engine with the given name
   *
   * @param {string} name
   *        Name of the search engine to select
   */
  select : function searchengine_select(name)
  {
    var engineDropDown = new elementslib.Lookup(this._controller.window.document,
                                                searchEngineButton);
    this._controller.click(engineDropDown);

    // Temporarily needed to propagate the event
    this._controller.sleep(0);

    var popupEntry = new elementslib.Lookup(this._controller.window.document,
                                            searchEnginePopup + '/id("' + name + '")');
    this._controller.click(popupEntry);

    // Temporarily needed to propagate the event
    this._controller.sleep(0);
 }
};
