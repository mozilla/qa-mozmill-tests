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
 * The Original Code is Google toolbar mozmill test suite.
 *
 * The Initial Developer of the Original Code is Google.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Ankush Kalkote <ankush@google.com>
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
 * @fileoverview This file contains API class related to GTB-Searchbox.
 * This class provides high level functions to access GTB-Searchbox.
 * @supported Firefox versions above or equal to 3.0
 *
 * @author ankush@google.com
 */

const MODULE_NAME = 'SearchBoxAPI';

/**
 * Timeout in milliseconds for SearchBoxAPI.
 * @type {number}
 */
const TIME_OUT_SEARCHAPI = 60000; // 1 min

/**
 * Interval used for polling in milliseconds for SearchBoxAPI.
 * @type {number}
 */
const INTERVAL_SEARCHAPI = 100; // 100ms

/**
 * Element Ids for google toolbar elements.
 * @type {string}
 */
const GTB_SEARCH_BOX_ID = 'gtbGoogleSearchBox';
const GTB_SEARCH_BUTTON_ID = '/id("main-window")/id("navigator-toolbox")/' +
                             'id("gtbToolbar")/id("gtbSearchBox")/' +
                             'id("gtbSearchButton")/anon({"anonid":"button"})';
const HISTORY_DROP_MARKER_ID = '/id("main-window")/id("navigator-toolbox")/' +
                               'id("gtbToolbar")/id("gtbSearchBox")/' +
                               'anon({"anonid":"textbox"})/' +
                               'anon({"anonid":"historydropmarker"})';
const GTB_SUGGEST_CLEAR_ID = 'gtb-suggest-clear';
const GTB_SUGGEST_IFRAME_ID = 'gtb-suggest-iframe';
const GTB_SUGGEST_CONTENT_ID = 'gtb-suggest-content';
const GTB_SUGGESTLIST_ID = 'suggestList';

/**
 * This class contains necessary methods related to GTB-SearchBox.
 * @param {MozMillController} controller Mozmill controller of the FF-window.
 * @constructor
 */
function SearchBoxAPI(controller) {
  /**
   * Mozmill Controller object of FF window.
   * @type {MozMillController}
   * @private
   */
  this.controller_ = controller;

  /**
   * Elementslib object for GTB Search-box element.
   * @type {Object}
   * @private
   */
  this.searchBoxElement_ = new elementslib.ID(this.controller_.window.document,
                                              GTB_SEARCH_BOX_ID);

  /**
   * XUL object corresponding to GTB Search-box element.
   * @type {Object}
   * @private
   */
  this.searchBoxXulElement_ = this.controller_.window.document.getElementById(
                                  GTB_SEARCH_BOX_ID);
  // GTB_Toolbar object's history service.
  this.gtbHistoryService = this.controller_.window.GTB_getToolbar().
                               htmlSuggest_.historyService_;
}

/**
 * Types queryString in GTB-SearchBox.
 * @param {string} queryString to be searched.
 */
SearchBoxAPI.prototype.putNewQuery = function(queryString) {
  this.resetQuery(); // First clear Searchbox and then put a new query in it.
  this.controller_.type(this.searchBoxElement_, queryString);
  this.controller_.assertValue(this.searchBoxElement_, queryString);
};

/**
 * @return {string} string in GTB-SearchBox.
 */
SearchBoxAPI.prototype.getQuery = function() {
  return this.searchBoxXulElement_.value;
};

/**
 * Resets GTB-SearchBox. Removes earlier query from it.
 */
SearchBoxAPI.prototype.resetQuery = function() {
  this.focusSearchBoxByKey();
  this.controller_.keypress(this.searchBoxElement_, 'VK_DELETE', {});
  this.controller_.assertValue(this.searchBoxElement_, '');
};

/**
 * Focuses GTB-SearchBox by pressing shortcut-key.
 */
SearchBoxAPI.prototype.focusSearchBoxByKey = function() {
  this.controller_.keypress(null, 'g', {altKey: true});
};

/**
 * Press enter and wait for search results page to load.
 */
SearchBoxAPI.prototype.performSearchByEnterKey = function() {
  this.controller_.keypress(this.searchBoxElement_, 'VK_RETURN', {});
  this.controller_.waitForPageLoad(this.controller_.tabs.activeTab);
};

/**
 * Performs Mouse click on GTB-SearchButton.
 */
SearchBoxAPI.prototype.clickGtbSearchButton = function() {
  var gtbSearchButton = new elementslib.Lookup(this.controller_.window.document,
                                               GTB_SEARCH_BUTTON_ID);
  this.controller_.click(gtbSearchButton);
  this.controller_.waitForPageLoad();
};

/**
 * Checks if suggestList element appears.
 */
SearchBoxAPI.prototype.checkForSuggestList = function() {
  this.controller_.waitForElement(
      new elementslib.ID(this.controller_.window.document, 'suggestList'),
      TIME_OUT_SEARCHAPI, INTERVAL_SEARCHAPI);
};

/**
 * Populates SearchBoxHistory with word-list.
 * @param {Array.<string>} queryList list of queries to populate search history.
 */
SearchBoxAPI.prototype.populateSearchHistory = function(queryList) {
  for (var i = 0; i < queryList.length; i++) {
    this.putNewQuery(queryList[i]);
    this.performSearchByEnterKey();
  }
};

/**
 * Clicks on history drop marker of the gtbSearchBox.
 */
SearchBoxAPI.prototype.clickHistoryDropMarker = function() {
  var historyDropMarker = new elementslib.Lookup(
      this.controller_.window.document, HISTORY_DROP_MARKER_ID);
  this.controller_.click(historyDropMarker);
};

/**
 * Clears Search History by clicking on 'Clear-search-history' in suggest
 * dropdown.
 */
SearchBoxAPI.prototype.clickClearSearchHistory = function() {
  // If history is already empty, then clear history button will not appear.
  if (!this.gtbHistoryService.isEmpty()) {
    this.clickHistoryDropMarker();
    var clearHistoryButton = new elementslib.ID(
        this.controller_.window.document, GTB_SUGGEST_CLEAR_ID);

    var clearHistoryButtonStyle = this.controller_.window.getComputedStyle(
        clearHistoryButton.getNode(), '');

    // Wsit till the clearHistoryButton is visible. The wait is achieved by
    // polling its 'visibility' property.
    this.controller_.waitForEval(
        'subject.getPropertyValue("visibility") == "visible"',
        TIME_OUT_SEARCHAPI, INTERVAL_SEARCHAPI, clearHistoryButtonStyle);

    this.controller_.click(clearHistoryButton);
  }
};

/**
 * Gives list of items appearing in the history.
 * First it clicks on the historydrop-marker on SearchBox and returns items
 * appearing as a part of history.
 * @return {Array.<string>} list of history items.
 */
SearchBoxAPI.prototype.getHistoryFromPopDown = function() {
  if (this.gtbHistoryService.isEmpty()) {
    return []; // If history is empty return empty array.
  }

  this.resetQuery();
  this.clickHistoryDropMarker();
  // TODO(ankush): Find more elegant solution for Minefield (FF3.7)
  // Second time clicking is required only For FF3.7. History items are not
  // appearing in the iframe with first click. Probably there is problem with
  // clearing search-box on Minefield.
  this.clickHistoryDropMarker();

  var historyItemsXmlObject = this.getSuggestListXml();
  return getHistoryItems(historyItemsXmlObject);
};

/**
 * Returns XML string appearing in toolbar's suggest-list iframe.
 * @return {Object} XML object of suggestList.
 */
SearchBoxAPI.prototype.getSuggestListXml = function() {
  var suggestWindowContentDomElement = this.controller_.window.document.
      getElementById(GTB_SUGGEST_IFRAME_ID).docShell.document.getElementById(
      GTB_SUGGEST_CONTENT_ID);

  // Wait for the suggestList element to appear.
  this.controller_.waitForEval(
      'subject.contentDocument.getElementById("suggestList") != null',
      TIME_OUT_SEARCHAPI, INTERVAL_SEARCHAPI, suggestWindowContentDomElement);

  var suggestItemsTable = suggestWindowContentDomElement.contentDocument.
                          getElementById(GTB_SUGGESTLIST_ID).innerHTML;

  // historyItemsTable is a string. create XML object corresponding to it.
  // eg. historyItemsTable : ""
  var suggestItemsXmlObject =
      (new this.controller_.window.DOMParser()).parseFromString(
      suggestItemsTable, 'text/xml');
  return suggestItemsXmlObject;
};

/**
 * Parses the XML object corresponding to historyItemsTable and returns
 * history items list.
 * @param {Object} historyItemsXmlObject XML object of history list.
 * @return {Array.<string>} list of history items.
 */
function getHistoryItems(historyItemsXmlObject) {
  var historyItemNodes = historyItemsXmlObject.getElementsByTagName('td');
  var historyItemsArray = [];

  for (var i = 0, node; node = historyItemNodes[i]; i++) {
    if (node.firstChild.nodeValue != null) {
      historyItemsArray.push(node.firstChild.nodeValue);
    }
  }
  return historyItemsArray;
}

/**
 * Gets history items from GTB toolbar object's historyService.
 * It returns array containing historyItems. The number of items in the array
 * is equal to numberOfItems or gtbHistory length whichever is smaller.
 * @param {number} numberOfItems number of history items to be returned.
 * @return {Array.<string>} list of history items.
 */
SearchBoxAPI.prototype.getGtbHistoryItems = function(numberOfItems) {
  var historyItemsArray = [];
  var gtbHistory = this.gtbHistoryService.history_;
  for (var i = 0; i < gtbHistory.length && i < numberOfItems; i++) {
    historyItemsArray.push(gtbHistory[i].query);
  }
  return historyItemsArray;
};
