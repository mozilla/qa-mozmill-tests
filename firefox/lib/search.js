/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The SearchAPI adds support for search related functions like the search bar.
 */

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert, expect } = require("../../lib/assertions");
var modalDialog = require("../../lib/modal-dialog");
var utils = require("../../lib/utils");

var dialogs = require("../../lib/ui/dialogs");
var widgets = require("../../lib/ui/widgets");

var autoCompleteController = Cc["@mozilla.org/autocomplete/controller;1"]
                             .getService(Ci.nsIAutoCompleteController);

const TIMEOUT_NEW_SEARCH_BEGIN = 1000;
const TIMEOUT_REQUEST_SUGGESTIONS = 5000;
const TIMEOUT_INSTALL_DIALOG = 30000;

// Helper lookup constants for the engine manager elements
const MANAGER_BUTTONS   = '/id("engineManager")/anon({"anonid":"buttons"})';

// Helper lookup constants for the search bar elements
const NAV_BAR             = '/id("main-window")/id("tab-view-deck")/[0]' +
                            '/id("navigator-toolbox")/id("nav-bar")';

const NAV_BAR_TARGET      = NAV_BAR         + utils.australis.getElement("nav-bar-wrapper");
const SEARCH_BAR          = NAV_BAR_TARGET  + '/id("search-container")/id("searchbar")';
const SEARCH_TEXTBOX      = SEARCH_BAR      + '/anon({"anonid":"searchbar-textbox"})';
const SEARCH_DROPDOWN     = SEARCH_TEXTBOX  + '/[1]/anon({"anonid":"searchbar-engine-button"})';
const SEARCH_POPUP        = SEARCH_DROPDOWN + '/anon({"anonid":"searchbar-popup"})';
const SEARCH_INPUT        = SEARCH_TEXTBOX  + '/anon({"class":"autocomplete-textbox-container"})' +
                                              '/anon({"anonid":"textbox-input-box"})' +
                                              '/anon({"anonid":"input"})';
const SEARCH_CONTEXT      = SEARCH_TEXTBOX  + '/anon({"anonid":"textbox-input-box"})' +
                                              '/anon({"anonid":"input-box-contextmenu"})';
const SEARCH_GO_BUTTON    = SEARCH_TEXTBOX  + '/anon({"class":"search-go-container"})' +
                                              '/anon({"class":"search-go-button"})';
const SEARCH_AUTOCOMPLETE =  '/id("main-window")/id("mainPopupSet")/id("PopupAutoComplete")';

const TOPIC_SEARCH_ENGINE_MODIFIED = "browser-search-engine-modified";

/**
 * Constructor
 *
 * @param {MozMillController} aController
 *        MozMillController of the engine manager
 */
function engineManager(aController) {
  this._controller = aController;
}

/**
 * Search Manager class
 */
engineManager.prototype = {
  /**
   * Get the controller of the associated engine manager dialog
   *
   * @returns Controller of the browser window
   * @type MozMillController
   */
  get controller() {
    return this._controller;
  },

  /**
   * Gets the list of search engines
   *
   * @returns List of engines
   * @type object
   */
  get engines() {
    var engines = [ ];
    var tree = this.getElement({type: "engine_list"}).getNode();

    for (var ii = 0; ii < tree.view.rowCount; ii ++) {
      engines.push({name: tree.view.getCellText(ii, tree.columns.getColumnAt(0)),
                    keyword: tree.view.getCellText(ii, tree.columns.getColumnAt(1))});
    }

    return engines;
  },

  /**
   * Gets the name of the selected search engine
   *
   * @returns Name of the selected search engine
   * @type string
   */
  get selectedEngine() {
    var treeNode = this.getElement({type: "engine_list"}).getNode();

    if(this.selectedIndex != -1) {
      return treeNode.view.getCellText(this.selectedIndex,
                                       treeNode.columns.getColumnAt(0));
    }
    else {
      return null;
    }
  },

  /**
   * Select the engine with the given name
   *
   * @param {string} aName
   *        Name of the search engine to select
   */
  set selectedEngine(aName) {
    var treeNode = this.getElement({type: "engine_list"}).getNode();

    for (var ii = 0; ii < treeNode.view.rowCount; ii ++) {
      if (aName == treeNode.view.getCellText(ii, treeNode.columns.getColumnAt(0))) {
        this.selectedIndex = ii;
        break;
      }
    }
  },

  /**
   * Gets the index of the selected search engine
   *
   * @returns Index of the selected search engine
   * @type number
   */
  get selectedIndex() {
    var tree = this.getElement({type: "engine_list"});
    var treeNode = tree.getNode();

    return treeNode.view.selection.currentIndex;
  },

  /**
   * Select the engine with the given index
   *
   * @param {number} aIndex
   *        Index of the search engine to select
   */
  set selectedIndex(aIndex) {
    var tree = this.getElement({type: "engine_list"});
    var treeNode = tree.getNode();

    if (aIndex < treeNode.view.rowCount) {
      widgets.clickTreeCell(this._controller, tree, aIndex, 0, {});
    }

    assert.waitFor(function () {
      return this.selectedIndex === aIndex;
    }, "Search engine has been selected. Expected index: '" + aIndex + "'", undefined, undefined, this);
  },

  /**
   * Gets the suggestions enabled state
   */
  get suggestionsEnabled() {
    var checkbox = this.getElement({type: "suggest"});

    return checkbox.getNode().checked;
  },

  /**
   * Sets the suggestions enabled state
   */
  set suggestionsEnabled(aState) {
    var checkbox = this.getElement({type: "suggest"});
    this._controller.check(checkbox, aState);
  },

  /**
   * Handles the search engine installation procedure
   *
   * @param {MozMillController} aController
   *        MozMillController of the window to operate on
   *
   * @private
   */
  _handleEngineInstall : function engineManager_handleEngineInstall(aController) {
    var dialog = new dialogs.AddEngineConfirmDialog(aController);
    var title = dialog.getProperty("addEngineConfirmTitle");
    expect.equal(dialog.title, title, "Window contains search engine title");

    // Check that the correct domain is shown
    var infoBody = dialog.getElement({type: "info_body"});
    assert.waitFor(() => (infoBody.getNode().textContent.indexOf('localhost') !== -1),
                   "Search Engine URL contains the 'localhost' domain");
    dialog.accept();
  },

  /**
   * Close the engine manager
   *
   * @param {MozMillController} controller
   *        MozMillController of the window to operate on
   * @param {boolean} aSaveChanges
   *        (Optional) If true the OK button is clicked otherwise Cancel
   */
  close : function preferencesDialog_close(aSaveChanges) {
    aSaveChanges = (aSaveChanges == undefined) ? false : aSaveChanges;

    var button = this.getElement({type: "button", subtype: (aSaveChanges ? "accept" : "cancel")});
    this._controller.click(button);
  },

  /**
   * Edit the keyword associated to a search engine
   *
   * @param {string} aName
   *        Name of the engine to remove
   * @param {function} aHandler
   *        Callback function for Engine Manager
   */
  editKeyword : function engineManager_editKeyword(aName, aHandler) {
    // Select the search engine
    this.selectedEngine = aName;

    // Setup the modal dialog handler
    md = new modalDialog.modalDialog(this._controller.window);
    md.start(aHandler);

    var button = this.getElement({type: "engine_button", subtype: "edit"});
    this._controller.click(button);
    md.waitForDialog();
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function engineManager_getDtds() {
    var dtds = ["chrome://browser/locale/engineManager.dtd"];
    return dtds;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type ElemBase
   */
  getElement : function engineManager_getElement(aSpec) {
    var elem = null;

    switch(aSpec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "more_engines":
        elem = new elementslib.ID(this._controller.window.document, "addEngines");
        break;
      case "button":
        elem = new elementslib.Lookup(this._controller.window.document, MANAGER_BUTTONS +
                                      '/{"dlgtype":"' + aSpec.subtype + '"}');
        break;
      case "engine_button":
        switch(aSpec.subtype) {
          case "down":
            elem = new elementslib.ID(this._controller.window.document, "down");
            break;
          case "edit":
            elem = new elementslib.ID(this._controller.window.document, "edit");
            break;
          case "remove":
            elem = new elementslib.ID(this._controller.window.document, "remove");
            break;
          case "up":
            elem = new elementslib.ID(this._controller.window.document, "up");
            break;
        }
        break;
      case "engine_list":
        elem = new elementslib.ID(this._controller.window.document, "engineList");
        break;
      case "suggest":
        elem = new elementslib.ID(this._controller.window.document, "enableSuggest");
        break;
      default:
        assert.fail("Unknown element type - " + aSpec.type);
    }

    return elem;
  },

  /**
   * Clicks the "Get more search engines..." link
   */
  getMoreSearchEngines : function engineManager_getMoreSearchEngines() {
    var link = this.getElement({type: "more_engines"});
    this._controller.click(link);
  },

  /**
   * Installs a custom search engine from an URL
   *
   * @param {String} aName
   *        Engine name
   * @param {String} aUrl
   *        Custom engine URL value
   * @param {Function} aAddEngineCallback
   *        Callback to trigger the installation of the engine
   */
  installFromUrl : function engineManager_installFromUrl(aName, aUrl, aAddEngineCallback) {
    assert.equal(typeof aAddEngineCallback, "function",
                 "Callback for adding an engine has been specified");

    this._controller.open(aUrl);
    this._controller.waitForPageLoad();

    // Create a modal dialog instance to handle the installation dialog
    var md = new modalDialog.modalDialog(this._controller.window);
    md.start(this._handleEngineInstall);

    var engineAdded = false;
    var observer = {
      observe: (aSubject, aTopic, aData) => {
        if (aData === "engine-added") {
          engineAdded = true;
        }
      }
    };

    Services.obs.addObserver(observer, TOPIC_SEARCH_ENGINE_MODIFIED, false);
    try {
      aAddEngineCallback();

      md.waitForDialog(TIMEOUT_INSTALL_DIALOG);

      assert.waitFor(() =>  engineAdded,
                     "Search engine '" + aName + "' has been installed");
    }
    finally {
      Services.obs.removeObserver(observer, TOPIC_SEARCH_ENGINE_MODIFIED);
    }

    // Check if the local engine has been installed
    var searchBarInstance = new searchBar(this._controller);
    assert.waitFor(function () {
      return searchBarInstance.isEngineInstalled(aName);
    }, "Search engine '" + aName + "' has been installed");

    // The engine should not be selected by default
    expect.notEqual(searchBarInstance.selectedEngine, aName,
                    "Search engine has been selected");
  },

  /**
   * Move down the engine with the given name
   *
   * @param {string} aName
   *        Name of the engine to remove
   */
  moveDownEngine : function engineManager_moveDownEngine(aName) {
    this.selectedEngine = aName;
    var index = this.selectedIndex;

    var button = this.getElement({type: "engine_button", subtype: "down"});
    this._controller.click(button);

    assert.waitFor(function () {
      return this.selectedIndex === (index + 1);
    }, "Search engine has been moved down", undefined, undefined, this);
  },

  /**
   * Move up the engine with the given name
   *
   * @param {string} aName
   *        Name of the engine to remove
   */
  moveUpEngine : function engineManager_moveUpEngine(aName) {
    this.selectedEngine = aName;
    var index = this.selectedIndex;

    var button = this.getElement({type: "engine_button", subtype: "up"});
    this._controller.click(button);

    assert.waitFor(function () {
      return this.selectedIndex === (index - 1);
    }, "Search engine has been moved up", undefined, undefined, this);
  },

  /**
   * Remove the engine with the given name
   *
   * @param {string} aName
   *        Name of the engine to remove
   */
  removeEngine : function engineManager_removeEngine(aName) {
    this.selectedEngine = aName;

    var button = this.getElement({type: "engine_button", subtype: "remove"});
    this._controller.click(button);

    assert.waitFor(function () {
      return this.selectedEngine !== aName;
    }, "Search engine has been removed. Expected: '" + aName + "'", undefined, undefined, this);
  },

  /**
   * Restores the defaults for search engines
   */
  restoreDefaults : function engineManager_restoreDefaults() {
    var button = this.getElement({type: "button", subtype: "extra2"});
    this._controller.click(button);
  }
};

/**
 * Constructor
 *
 * @param {MozMillController} aController
 *        MozMillController of the browser window to operate on
 */
function searchBar(aController) {
  this._controller = aController;
}

/**
 * Search Manager class
 */
searchBar.prototype = {
  /**
   * Get the controller of the associated browser window
   *
   * @returns Controller of the browser window
   * @type MozMillController
   */
  get controller() {
    return this._controller;
  },

  /**
   * Get the names of all installed engines
   */
  get engines() {
    var engines = [ ];
    var popup = this.getElement({type: "searchBar_dropDownPopup"});

    for (var ii = 0; ii < popup.getNode().childNodes.length; ii++) {
      var entry = popup.getNode().childNodes[ii];
      if (entry.className.indexOf("searchbar-engine") != -1) {
        engines.push({name: entry.id,
                      selected: entry.selected,
                      tooltipText: entry.getAttribute('tooltiptext')
                    });
      }
    }

    return engines;
  },

  /**
   * Get the search engines drop down open state
   */
  get enginesDropDownOpen() {
    var popup = this.getElement({type: "searchBar_dropDownPopup"});
    return popup.getNode().state != "closed";
  },

  /**
   * Set the search engines drop down open state
   */
  set enginesDropDownOpen(aNewState) {
    if (this.enginesDropDownOpen != aNewState) {
      var button = this.getElement({type: "searchBar_dropDown"});
      this._controller.click(button);

      assert.waitFor(function () {
        return this.enginesDropDownOpen === aNewState;
      }, "Search engines drop down open state has been changed. Expected: '"
      + aNewState + "'", undefined, undefined, this);
      this._controller.sleep(0);
    }
  },

  /**
   * Get the names of all installable engines
   */
  get installableEngines() {
    var engines = [ ];
    var popup = this.getElement({type: "searchBar_dropDownPopup"});

    for (var ii = 0; ii < popup.getNode().childNodes.length; ii++) {
      var entry = popup.getNode().childNodes[ii];
      if (entry.className.indexOf("addengine-item") != -1) {
        engines.push({name: entry.getAttribute('title'),
                      selected: entry.selected,
                      tooltipText: entry.getAttribute('tooltiptext')
                    });
      }
    }

    return engines;
  },

  /**
   * Returns the currently selected search engine
   *
   * @return Name of the currently selected engine
   * @type string
   */
  get selectedEngine() {
    // Open drop down which updates the list of search engines
    var state = this.enginesDropDownOpen;
    this.enginesDropDownOpen = true;

    var engine = this.getElement({type: "engine", subtype: "selected", value: "true"});
    this._controller.waitForElement(engine);

    this.enginesDropDownOpen = state;

    return engine.getNode().label;
  },

  /**
   * Select the search engine with the given name if it is not already selected
   *
   * @param {string} aName
   *        Name of the search engine to select
   */
  set selectedEngine(aName) {
    if (aName !== Services.search.currentEngine.name) {
      // Open drop down and click on search engine
      this.enginesDropDownOpen = true;

      var engine = this.getElement({type: "engine", subtype: "label", value: aName});
      var engineChanged = false;
      var observer = {
        observe: (aSubject, aTopic, aData) => {
          if (aData === "engine-default") {
            engineChanged = true;
          }
        }
      }
      Services.obs.addObserver(observer, TOPIC_SEARCH_ENGINE_MODIFIED, false);

      try {
        engine.waitThenClick();
        assert.waitFor(() =>  engineChanged,
                       "Search engine has been selected. Expected '" + aName + "'");
      }
      finally {
        Services.obs.removeObserver(observer, TOPIC_SEARCH_ENGINE_MODIFIED);
      }
    }
  },

  /**
   * Returns all the visible search engines (API call)
   */
  get visibleEngines() {
    return Services.search.getVisibleEngines({});
  },

  /**
   * Checks if the correct target URL has been opened for the search
   *
   * @param {string} aSearchTerm
   *        Text which should be checked for
   */
  checkSearchResultPage : function searchBar_checkSearchResultPage(aSearchTerm) {
    // Retrieve the URL which is used for the currently selected search engine
    var targetUri = Services.search.currentEngine.getSubmission(aSearchTerm, null).uri;
    var currentUrl = this._controller.tabs.activeTabWindow.document.location;

    var domainRegex = /[^\.]+\.([^\.]+)\..+$/gi;
    var targetDomainName = targetUri.hostPort.replace(domainRegex, "$1");
    var currentDomainName = currentUrl.host.replace(domainRegex, "$1");

    expect.equal(currentDomainName, targetDomainName,
                 "Current domain name matches target domain name");

    // Check if search term is listed in URL
    expect.ok(currentUrl.href.toLowerCase().indexOf(aSearchTerm.toLowerCase()) != -1,
              "Current URL contains the search term '" +
              aSearchTerm.toLowerCase() + "'");
  },

  /**
   * Clear the search field
   */
  clear : function searchBar_clear() {
    var activeElement = this._controller.window.document.activeElement;

    var searchInput = this.getElement({type: "searchBar_input"});
    var cmdKey = utils.getEntity(this.getDtds(), "selectAllCmd.key");
    this._controller.keypress(searchInput, cmdKey, {accelKey: true});
    this._controller.keypress(searchInput, 'VK_DELETE', {});

    if (activeElement)
      activeElement.focus();
  },

  /**
   * Focus the search bar text field
   *
   * @param {object} aEvent
   *        Specifies the event which has to be used to focus the search bar
   */
  focus : function searchBar_focus(aEvent) {
    var input = this.getElement({type: "searchBar_input"});

    switch (aEvent.type) {
      case "click":
        this._controller.click(input);
        break;
      case "shortcut":
        if (mozmill.isLinux) {
          var cmdKey = utils.getEntity(this.getDtds(), "searchFocusUnix.commandkey");
        }
        else {
          var cmdKey = utils.getEntity(this.getDtds(), "searchFocus.commandkey");
        }
        this._controller.keypress(null, cmdKey, {accelKey: true});
        break;
      default:
        assert.fail("Unknown element type - " + aEvent.type);
    }

    // Check if the search bar has the focus
    var activeElement = this._controller.window.document.activeElement;
    assert.equal(input.getNode(), activeElement, "Search bar has the focus");
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function searchBar_getDtds() {
    var dtds = ["chrome://browser/locale/browser.dtd"];
    return dtds;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type ElemBase
   */
  getElement : function searchBar_getElement(aSpec) {
    var elem = null;

    switch(aSpec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "engine":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_POPUP +
                                      '/anon({"' + aSpec.subtype + '":"' + aSpec.value + '"})');
        break;
      case "engine_manager":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_POPUP +
                                      '/anon({"anonid":"open-engine-manager"})');
        break;
      case "searchBar":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_BAR);
        break;
      case "searchBar_autoCompletePopup":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_AUTOCOMPLETE);
        break;
      case "searchBar_contextMenu":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_CONTEXT);
        break;
      case "searchBar_dropDown":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_DROPDOWN);
        break;
      case "searchBar_dropDownPopup":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_POPUP);
        break;
      case "searchBar_goButton":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_GO_BUTTON);
        break;
      case "searchBar_input":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_INPUT);
        break;
      case "searchBar_suggestions":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_AUTOCOMPLETE +
                                      '/anon({"anonid":"tree"})');
         break;
      case "searchBar_textBox":
        elem = new elementslib.Lookup(this._controller.window.document, SEARCH_TEXTBOX);
        break;
      default:
        assert.fail("Unknown element type - " + aSpec.type);
    }

    return elem;
  },

  /**
   * Returns the search suggestions for the search term or null if the engine
   * does not support suggestions
   */
  getSuggestions : function(aSearchTerm) {
    // Check if the current search engine supports suggestions
    if (!this.hasSuggestions(this.selectedEngine))
      return null;

    var suggestions = [ ];
    var popup = this.getElement({type: "searchBar_autoCompletePopup"});
    var treeElem = this.getElement({type: "searchBar_suggestions"});

    // Bug 542990
    // Bug 392633
    // Typing too fast can cause several issue like the suggestions not to appear.
    // Lets type the letters one by one and wait for the popup or the timeout
    for (var i = 0; i < aSearchTerm.length; i++) {
      try {
        this.type(aSearchTerm[i]);

        //Wait a second for a new search to begin
        assert.waitFor(() => {
          return autoCompleteController.searchStatus !==
                 autoCompleteController.STATUS_COMPLETE_MATCH;
        }, "", TIMEOUT_NEW_SEARCH_BEGIN);

        // Wait for the search to complete
        assert.waitFor(() => {
          return popup.getNode().state === 'open' &&
                 autoCompleteController.searchStatus ===
                 autoCompleteController.STATUS_COMPLETE_MATCH;
        }, "", TIMEOUT_REQUEST_SUGGESTIONS);
      }
      catch (e) {
        // We are not interested in handling the timeout for now
      }
    }

    // Get suggestions in an array if the popup with suggestions is opened
    if (popup.getNode().state === 'open') {
      this._controller.waitForElement(treeElem);

      // Get all suggestions
      var tree = treeElem.getNode();
      expect.waitFor(function () {
        return tree.view != null;
      }, "Auto-complete results are visible");

      for (var i = 0; i < tree.view.rowCount; i ++) {
        suggestions.push(tree.view.getCellText(i, tree.columns.getColumnAt(0)));
      }

      // Close auto-complete popup
      this._controller.keypress(popup, "VK_ESCAPE", {});
      assert.waitFor(function () {
        return popup.getNode().state == 'closed'
      }, "Auto-complete popup has been closed");
    }

    return suggestions;
  },

  /**
   * Check if a search engine supports suggestions (API call)
   *
   * @param {string} aName
   *        Name of the search engine to check
   */
  hasSuggestions : function searchBar_hasSuggestions(aName) {
    var engine = Services.search.getEngineByName(aName);
    return engine.supportsResponseType("application/x-suggestions+json");
  },

  /**
   * Install search engine (API call)
   *
   * @param {string} aName
   *         The search engine's name. Must be unique. Must not be null.
   * @param {string} aURL
   *        The URL to which search queries should be sent.
   *        Must not be null.
   * @param {object} aSpec
   *        Custom settings for the newly added search engine
   *        Elements: method  -  The HTTP request method used when submitting
   *                             a search query.
   *                             [optional - default: GET]
   *                  selected - Decide if the added search engine is selected
   *                             [optional - default: false]
   */
  installEngine: function searchBar_installEngine(aName, aURL, aSpec) {
    var spec = aSpec || { };
    var method = (spec.method == undefined) ? "GET" : spec.method;
    var selected = (spec.selected == undefined) ? false : spec.selected;

    Services.search.addEngineWithDetails(aName, null, null, null,
                                         method, aURL);
    if (selected) {
      aEngine = Services.search.getEngineByName(aName);
      Services.search.currentEngine = aEngine;
    }
  },

  /**
   * Check if a search engine is installed (API call)
   *
   * @param {string} aName
   *        Name of the search engine to check
   */
  isEngineInstalled : function searchBar_isEngineInstalled(aName) {
    var engine = Services.search.getEngineByName(aName);
    return (engine != null);
  },

  /**
   * Open the Engine Manager
   *
   * @param {function} aHandler
   *        Callback function for Engine Manager
   */
  openEngineManager : function searchBar_openEngineManager(aHandler) {
    this.enginesDropDownOpen = true;
    var engineManager = this.getElement({type: "engine_manager"});

    // Setup the modal dialog handler
    md = new modalDialog.modalDialog(this._controller.window);
    md.start(aHandler);

    // Bug 555347
    // Process any outstanding events before clicking the entry
    this._controller.sleep(0);
    this._controller.click(engineManager);
    md.waitForDialog();

    expect.ok(!this.enginesDropDownOpen,
              "The search engine drop down menu has been closed");
  },

  /**
   * Remove the search engine with the given name (API call)
   *
   * @param {string} aName
   *        Name of the search engine to remove
   */
  removeEngine : function searchBar_removeEngine(aName) {
    if (this.isEngineInstalled(aName)) {
      var engine = Services.search.getEngineByName(aName);
      Services.search.removeEngine(engine);
    }
  },

  /**
   * Restore the default set of search engines (API call)
   */
  restoreDefaultEngines : function searchBar_restoreDefaults() {
    // Get the default engines list
    var defaults = Services.search.getDefaultEngines({ });

    // Remove installed engines that are not default
    Services.search.getEngines().forEach(function (aEngine) {
      if (defaults.indexOf(aEngine) === -1) {
         Services.search.removeEngine(aEngine);
      }
    });

    // Bug 556437
    // Restore default sorting
    Services.search.getEngines().forEach(function (aEngine, aIndex) {
      if (defaults.indexOf(aEngine) !== aIndex) {
        Services.search.moveEngine(aEngine, defaults.indexOf(aEngine));
      }
    });

    // Update the visibility status for each engine and reset the default engine
    Services.search.restoreDefaultEngines();
    Services.search.currentEngine = Services.search.defaultEngine;

    // Clear any entered search term
    this.clear();
  },

  /**
   * Start a search with the given search term and check if the resulting URL
   * contains the search term.
   *
   * @param {object} aData
   *        Object which contains the search term and the action type
   */
  search : function searchBar_search(aData) {
    var searchBar = this.getElement({type: "searchBar"});
    this.type(aData.text);

    switch (aData.action) {
      case "returnKey":
        this._controller.keypress(searchBar, 'VK_RETURN', {});
        break;
      case "goButton":
      default:
        this._controller.click(this.getElement({type: "searchBar_goButton"}));
        break;
    }

    this._controller.waitForPageLoad();
    this.checkSearchResultPage(aData.text);
  },

  /**
   * Enter a search term into the search bar
   *
   * @param {string} aSearchTerm
   *        Text which should be searched for
   */
  type : function searchBar_type(aSearchTerm) {
    var searchBar = this.getElement({type: "searchBar"});
    this._controller.type(searchBar, aSearchTerm);
  }
};

// Export of classes
exports.engineManager = engineManager;
exports.searchBar = searchBar;
