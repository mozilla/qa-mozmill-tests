/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var frame = {};
Cu.import('resource://mozmill/modules/frame.js', frame);

Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert, expect } = require("assertions");
var domUtils = require("dom-utils");
var prefs = require("prefs");
// Bug 1040605
// Addons should be refactored (ui/backend & general & product specific code)
// Once fixed, code which needs tabs will live into firefox/lib/addons.js
var tabs = require("../firefox/lib/tabs");
var utils = require("utils");


const TIMEOUT_DOWNLOAD = 15000;
const TIMEOUT_REMOTE = 30000;

// AMO Preferences
const AMO_DISCOVER_URL = 'extensions.webservice.discoverURL';

// AMO instance to use
// Use staging for Nightly and DeveloperEdition
// Use production for Beta, Release and ESR builds
const AMO_DOMAIN = utils.appInfo.version.match(/a1|a2/) ? "addons.allizom.org"
                                                        : "addons.mozilla.org";

// Available search filters
const SEARCH_FILTER = [
  "local",
  "remote"
];

// Preferences which have to be changed to make sure we do not interact with the
// official AMO page but the preview site instead
const AMO_PREFERENCES = [
  {name: "extensions.getAddons.browseAddons", old: "addons.mozilla.org", new: AMO_DOMAIN},
  {name: "extensions.getAddons.recommended.browseURL", old: "addons.mozilla.org", new: AMO_DOMAIN},
  {name: "extensions.getAddons.recommended.url", old: "services.addons.mozilla.org", new: AMO_DOMAIN},
  {name: "extensions.getAddons.search.browseURL", old: "addons.mozilla.org", new: AMO_DOMAIN},
  {name: "extensions.getAddons.search.url", old: "services.addons.mozilla.org", new: AMO_DOMAIN},
  {name: "extensions.getMoreThemesURL", old: "addons.mozilla.org", new: AMO_DOMAIN}
];

/**
 * Constructor
 */
function AddonsManager(aController) {
  this._controller = aController;
  this._tabBrowser = new tabs.tabBrowser(this._controller);
  this._addonStateLabel = {
    askToActivate : "cmd.askToActivate.label",
    disable : "cmd.neverActivate.label",
    enable : "cmd.alwaysActivate.label"
  };
}

/**
 * Addons Manager class
 */
AddonsManager.prototype = {

  ///////////////////////////////
  // Global section
  ///////////////////////////////

  /**
   * Get the controller of the window
   *
   * @returns {MozMillController} Mozmill Controller
   */
  get controller() {
    return this._controller;
  },

  /**
   * Get the instance of the Discovery Pane
   *
   * @returns {DiscoveryPane} Instance of the Discovery Pane class
   */
  get discoveryPane() {
    // Make sure the "Get Add-ons" pane is selected
    var getAddons = this.getCategoryById({id: "discover"});
    assert.equal(this.selectedCategory.getNode(), getAddons.getNode(),
                 "'Get Add-ons' pane has been selected.");

    var browser = this.getElement({type: "discoveryPane"});

    return pane = new DiscoveryPane(this.controller,
                                    browser.getNode().contentDocument.defaultView);
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns URL's of external DTD files
   * @type {array of string}
   */
  get dtds() {
    var dtds = [
      "chrome://mozapps/locale/extensions/extensions.dtd",
      "chrome://browser/locale/browser.dtd"
    ];

    return dtds;
  },

  /**
   * Open the Add-ons Manager
   *
   * @param {object} aSpec
   *        Information how to open the Add-ons Manager
   *        Elements: type    - Event, can be menu, or shortcut
   *                            [optional - default: menu]
   *                  waitFor - Wait until the Add-ons Manager has been opened
   *                            [optional - default: true]
   *
   *
   * @returns Reference the tab with the Add-ons Manager open
   * @type {object}
   *       Elements: controller - Mozmill Controller of the window
   *                 index - Index of the tab
   */
  open : function AddonsManager_open(aSpec) {
    var tab = null;

    var spec = aSpec || { };
    var type = (spec.type == undefined) ? "menu" : spec.type;
    var waitFor = (spec.waitFor == undefined) ? true : spec.waitFor;

    var callback = () => {
      switch (type) {
        case "menu":
          this._controller.mainMenu.click("#menu_openAddons");
          break;
        case "shortcut":
          var cmdKey = utils.getEntity(this.dtds, "addons.commandkey");
          this._controller.keypress(null, cmdKey, {accelKey: true, shiftKey: true});
          break;
        default:
          assert.fail("Unknown event type - " + event.type);
      }
    };

    // Add event listener to wait until the view has been loaded
    var loaded = false;
    var onViewLoaded = () => { loaded = true; }
    this.controller.window.document.addEventListener("ViewChanged",
                                                     onViewLoaded, false);
    try {
      try {
        this._tabBrowser._waitForTabOpened(callback);
      }
      catch (e) {
        // If Addons manager is opened but there is no transitioned flag
        // either it was already opened or has opened in the current tab
        if (this.isOpen) {
          return;
        }

        throw e;
      }

      if (waitFor) {
        tab = this.waitForOpened();

        var categoryID = this.getCategoryId({category: this.selectedCategory});
        var timeout = (categoryID === "discover") ? TIMEOUT_REMOTE : undefined;

        assert.waitFor(() => loaded, "Selected category has been loaded.", timeout);
      }
    }
    finally {
      this.controller.window.document.removeEventListener("ViewChanged",
                                                          onViewLoaded, false);
    }

    return tab;
  },

  /**
   * Check if the Add-ons Manager is open
   *
   * @returns True if the Add-ons Manager is open
   * @type {boolean}
   */
  get isOpen() {
    return (this.getTabs().length > 0);
  },

  /**
   * Waits until the Addons Manager has been opened and returns its controller
   *
   * @param {object} aSpec
   *        Object with parameters for customization
   *        Elements: timeout - Duration to wait for the target state
   *                            [optional - default: 5s]
   *
   * @returns Currently selected tab
   */
  waitForOpened : function AddonsManager_waitforOpened(aSpec) {
    var spec = aSpec || { };
    var timeout = spec.timeout;

    assert.waitFor(function () {
      return this.isOpen;
    }, "Add-ons Manager has been opened", timeout, undefined, this);

    // The first tab found will be the selected one
    var tab = this.getTabs()[0];
    tab.controller.waitForPageLoad();

    return tab;
  },

  /**
   * Close the Addons Manager
   * @param {boolean} aIgnoreFailures
   *        Boolean value that sets the function to ignore failures if true
   *        or throw an Error if false
   *
   */
  close : function AddonsManager_close(aIgnoreFailures) {
    var aomTabs = this.getTabs();

    try {
      if (aomTabs[0].controller.tabs.length > 1) {
        var tabBrowser = new tabs.tabBrowser(aomTabs[0].controller);
        tabBrowser.closeTab({method: "middleClick", index: aomTabs[0].index});
      }
      else {
        aomTabs[0].controller.open("about:blank");
        aomTabs[0].controller.waitForPageLoad();
      }
    }
    catch (ex) {
      if (!aIgnoreFailures) {
        assert.fail("Add-ons Manager has been closed.");
      }
    }

    if (this.isOpen) {
       expect.fail("Not all Add-on Manager instances have been closed");
    }
  },

  /**
   * Retrieves the list of open add-ons manager tabs
   *
   * @returns List of open tabs
   * @type {array of object}
   *       Elements: controller - MozMillController
   *                 index      - Index of the tab
   */
  getTabs : function AddonsManager_getTabs() {
    return tabs.getTabsWithURL("about:addons");
  },

  /**
   * Opens the utils button menu and clicks the specified menu entry
   *
   * @param {object} aSpec
   *        Information about the menu
   *        Elements: item - menu item to click (updateNow, viewUpdates,
   *                         installFromFile, autoUpdateDefault,
   *                         resetAddonUpdatesToAutomatic,
   *                         resetAddonUpdatesToManual)
   */
  handleUtilsButton : function AddonsManager_handleUtilsButton(aSpec) {
    var spec = aSpec || { };
    var item = spec.item;
    assert.ok(item, arguments.callee.name + ": Menu item has been specified.");

    var button = this.getElement({type: "utilsButton"});
    var menu = this.getElement({type: "utilsButton_menu"});

    try {
      this._controller.click(button);

      // Click the button and wait until menu has been opened
      assert.waitFor(function () {
        return menu.getNode() && menu.getNode().state === "open";
      }, "Menu of utils button has been opened.");

      // Click the given menu entry
      var menuItem = this.getElement({
        type: "utilsButton_menuItem",
        value: "#utils-" + item
      });

      this._controller.click(menuItem);
    }
    finally {
      // Make sure the menu has been closed
      this._controller.keypress(menu, "VK_ESCAPE", {});

      assert.waitFor(function () {
        return menu.getNode() && menu.getNode().state === "closed";
      }, "Menu of utils button has been closed.");
    }
  },


  ///////////////////////////////
  // Add-on section
  ///////////////////////////////

  /**
   * Check if the specified add-on is compatible
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon - Add-on element
   *
   * @returns True if the add-on is compatible
   * @type {ElemBase}
   */
  isAddonCompatible : function AddonsManager_isAddonCompatible(aSpec) {
    var spec = aSpec || { };
    var addon = spec.addon;
    assert.ok(addon, arguments.callee.name + ": Add-on has been specified.");

    // Bug 599702
    // Doesn't give enough information which type of notification
    return addon.getNode().getAttribute("notification") != "warning";
  },

  /**
   * Check if the specified add-on is enabled
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon - Add-on element
   *
   * @returns True if the add-on is enabled
   * @type {ElemBase}
   */
  isAddonEnabled : function AddonsManager_isAddonEnabled(aSpec) {
    var spec = aSpec || { };
    var addon = spec.addon;
    assert.ok(addon, arguments.callee.name + ": Add-on has been specified.");

    return addon.getNode().getAttribute("active") == "true";
  },

  /**
   * Check if the specified add-on is installed
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon - Add-on element
   *
   * @returns True if the add-on is installed
   * @type {ElemBase}
   */
  isAddonInstalled : function AddonsManager_isAddonInstalled(aSpec) {
    var spec = aSpec || { };
    var addon = spec.addon;
    assert.ok(addon, arguments.callee.name + ": Add-on has been specified.");

    // Bug 600502
    // Add-ons in search view are not initialized correctly
    return addon.getNode().getAttribute("remote") == "false" &&
           addon.getNode().getAttribute("status") == "installed";
  },

  /**
   * Enables the specified add-on
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon - Add-on element
   */
  enableAddon : function AddonsManager_enableAddon(aSpec) {
    var spec = aSpec || { };
    spec.action = "enable";
    this.setAddonState(spec);
  },

  /**
   * Disables the specified add-on
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon - Add-on element
   */
  disableAddon : function AddonsManager_disableAddon(aSpec) {
    var spec = aSpec || { };
    spec.action = "disable";
    this.setAddonState(spec);
  },

  /**
   * Installs the specified add-on
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon   - Add-on element
   *                  waitFor - Wait until the category has been selected
   *                            [optional - default: true]
   *                  timeout - Duration to wait for the download
   *                            [optional - default: 15s]
   */
  installAddon : function AddonsManager_installAddon(aSpec) {
    var spec = aSpec || { };
    var addon = spec.addon;
    var timeout = spec.timeout;
    var button = "install";
    var waitFor = (spec.waitFor == undefined) ? true : spec.waitFor;

    var button = this.getAddonButton({addon: addon, button: button});
    this._controller.click(button);

    if (waitFor)
      this.waitForDownloaded({addon: addon, timeout: timeout});
  },

  /**
   * Removes the specified add-on
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon - Add-on element
   */
  removeAddon : function AddonsManager_removeAddon(aSpec) {
    var spec = aSpec || { };
    spec.button = "remove";

    // Wait for button to be displayed then click on it
    var button = this.getAddonButton(spec);
    assert.waitFor(() => utils.isDisplayed(this._controller, button));
    button.click();
  },

  /**
   * Undo the last action performed for the given add-on
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon - Add-on element
   */
  undo : function AddonsManager_undo(aSpec) {
    var spec = aSpec || { };
    spec.link = "undo";

    // Wait for link to be displayed
    var link = this.getAddonLink(spec);
    assert.waitFor(() => utils.isDisplayed(this._controller, link));
    link.click();
  },

  /**
   * Returns the addons from the currently selected view which match the
   * filter criteria
   *
   * @param {object} aSpec
   *        Information about the filter to apply
   *        Elements: attribute - DOM attribute of the wanted addon
   *                              [optional - default: ""]
   *                  value     - Value of the DOM attribute
   *                              [optional - default: ""]
   *
   * @returns List of addons
   * @type {array of ElemBase}
   */
  getAddons : function AddonsManager_addons(aSpec) {
    var spec = aSpec || {};

    return this.getElements({
      type: "addons",
      subtype: spec.attribute,
      value: spec.value,
      parent: this.selectedView
    });
  },

  /**
   * Returns the element of the specified add-ons button
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon  - Add-on element
   *                  button - Button (disable, enable, preferences, remove)
   *
   * @returns Add-on button
   * @type {ElemBase}
   */
  getAddonButton : function AddonsManager_getAddonButton(aSpec) {
    var spec = aSpec || { };
    var addon = spec.addon;
    var button = spec.button;
    assert.ok(button, arguments.callee.name + ": Button has been specified.");

    return this.getAddonChildElement({addon: addon, type: button + "Button"});
  },

  /**
   * Returns the element of the specified add-ons button
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon - Add-on element
   *
   * @returns Add-on menu
   * @type {ElemBase}
   */
  getAddonMenu : function AddonsManager_getAddonMenu(aSpec) {
    var spec = aSpec || { };

    return this.getAddonChildElement({addon: spec.addon, type: "stateMenu"});
  },

  /**
   * Returns the element of the specified add-ons link
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon - Add-on element
   *                  link  - Link
   *                            List view (more, restart, undo)
   *                            Detail view (findUpdates, restart, undo)
   *
   * @return Add-on link
   * @type {ElemBase}
   */
  getAddonLink : function AddonsManager_getAddonLink(aSpec) {
    var spec = aSpec || { };
    var addon = spec.addon;
    var link = spec.link;
    assert.ok(link, arguments.callee.name + ": Link has been specified.");

    return this.getAddonChildElement({addon: addon, type: link + "Link"});
  },

  /**
   * Returns the element of the specified add-ons radio group
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon      - Add-on element
   *                  radiogroup - Radiogroup
   *                                 Detail View (autoUpdate)
   *
   * @returns Add-on radiogroup
   * @type {ElemBase}
   */
  getAddonRadiogroup : function AddonsManager_getAddonRadiogroup(aSpec) {
    var spec = aSpec || { };
    var addon = spec.addon;
    var radiogroup = spec.radiogroup;
    assert.ok(radiogroup, arguments.callee.name + ": Radiogroup has been specified.");

    return this.getAddonChildElement({addon: addon, type: radiogroup + "Radiogroup"});
  },

  /**
   * Retrieve the given child element of the specified add-on
   *
   * @param {object} aSpec
   *        Information for getting the add-ons child node
   *        Elements: addon     - Add-on element
   *                  type      - Type of the element
   *                              [optional - default: use attribute/value]
   *                  attribute - DOM attribute of the node
   *                  value     - Value of the DOM attribute
   *                  wait      - Wait until element exists
   *                              [optional - default: true]
   *
   * @returns Element
   * @type {ElemBase}
   */
  getAddonChildElement : function AddonsManager_getAddonChildElement(aSpec) {
    var spec = aSpec || { };
    var addon = spec.addon;
    var attribute = spec.attribute;
    var value = spec.value;
    var type = spec.type;
    var wait = (typeof spec.wait !== "undefined") ? spec.wait : true;

    assert.ok(addon, arguments.callee.name + ": Add-on has been specified.");

    // If no type has been set retrieve a general element which needs an
    // attribute and value
    if (!type) {
      type = "element";

      assert.ok(attribute, arguments.callee.name + ": DOM attribute has been specified.");
      assert.ok(value, arguments.callee.name + ": Value has been specified.");
    }

    var prefix = this.isDetailViewActive ? "detailView_" : "listView_";
    var config = {
      type: prefix + type,
      subtype: attribute,
      value: value,
      parent: addon
    };

    if (!wait) {
      return this.getElement(config);
    }
    else {
      var element;
      assert.waitFor(() => {
        element = this.getElement(config);

        return element && utils.isDisplayed(this.controller, element);
      }, "Addon child element has been found.");

      return element;
    }
  },

  /**
   * Set addon enabled/disabled state
   *
   * @param {object} aSpec
   *        Information on which add-on to operate on
   *        Elements: addon  - Add-on element
   *                  action - Action to be taken on addons state,
   *                           can be "enable", "disable" or "askToActivate"
   */
  setAddonState : function AddonsManager_setAddonState(aSpec) {
    var addonCategory = this.getCategoryId({category: this.selectedCategory});

    // Handle 'plugins' separately from the others due to different UI
    if (addonCategory === "plugin") {
      var menu = this.getAddonMenu(aSpec);
      var stateLabel = utils.getEntity(this.dtds, this._addonStateLabel[aSpec.action]);
      this._controller.select(menu, null, stateLabel);
    }
    else {
      aSpec.button = aSpec.action;
      var button = this.getAddonButton(aSpec);
      this._controller.click(button);
    }
  },

  /**
   * Wait until the specified add-on has been downloaded
   *
   * @param {object} aSpec
   *        Object with parameters for customization
   *        Elements: addon   - Add-on element to wait for being downloaded
   *                  timeout - Duration to wait for the target state
   *                            [optional - default: 15s]
   */
  waitForDownloaded : function AddonsManager_waitForDownloaded(aSpec) {
    var spec = aSpec || { };
    var addon = spec.addon;
    var timeout = (spec.timeout == undefined) ? TIMEOUT_DOWNLOAD : spec.timeout;

    assert.ok(addon, arguments.callee.name + ": Add-on has been specified.");

    var self = this;
    var node = addon.getNode();

    assert.waitFor(function () {
      return node.getAttribute("pending") === "install" &&
             node.getAttribute("status") !== "installing";
    }, "'" + node.getAttribute("name") + "' has been downloaded", timeout);
  },


  ///////////////////////////////
  // Category section
  ///////////////////////////////

  /**
   * Retrieve the currently selected category
   *
   * @returns Element which represents the currently selected category
   * @type {ElemBase}
   */
  get selectedCategory() {
    return this.getCategories({attribute: "selected", value: "true"})[0];
  },

  /**
   * Returns the categories which match the filter criteria
   *
   * @param {object} aSpec
   *        Information about the filter to apply
   *        Elements: attribute - DOM attribute of the wanted category
   *                              [optional - default: ""]
   *                  value     - Value of the DOM attribute
   *                              [optional - default: ""]
   *
   * @returns List of categories
   * @type {array of ElemBase}
   */
  getCategories : function AddonsManager_categories(aSpec) {
    var spec = aSpec || { };

    var categories = this.getElements({
      type: "categories",
      subtype: spec.attribute,
      value: spec.value
    });
    assert.notEqual(categories.length, 0, arguments.callee.name + ": Categories has been found.");

    return categories;
  },

  /**
   * Get the category element for the specified id
   *
   * @param {object} aSpec
   *        Information for getting a category
   *        Elements: id - Category id (search, discover, locale,
   *                       extension, theme, plugin,
   *                       availableUpdates, recentUpdates)
   *
   * @returns Category
   * @type {ElemBase}
   */
  getCategoryById : function AddonsManager_getCategoryById(aSpec) {
    var spec = aSpec || { };
    var id = spec.id;
    assert.ok(id, arguments.callee.name + ": Category ID has been specified.");

    return this.getCategories({
      attribute: "id",
      value: "category-" + id
    })[0];
  },

  /**
   * Get the ID of the given category element
   *
   * @param {object} aSpec
   *        Information for getting a category
   *        Elements: category - Category to get the id from
   *
   * @returns Category Id
   * @type {string}
   */
  getCategoryId : function AddonsManager_getCategoryId(aSpec) {
    var spec = aSpec || { };
    var category = spec.category;
    assert.ok(category, arguments.callee.name + ": Category has been specified.");

    // Strip of the category prefix before returning the category id
    return category.getNode().id.match(/category-(.*)/)[1];
  },

  /**
   * Select the given category
   *
   * @param {object} aSpec
   *        Information for selecting a category
   *        Elements: category - Category element
   */
  setCategory : function AddonsManager_setCategory(aSpec) {
    var spec = aSpec || { };
    var category = spec.category;
    assert.ok(category, arguments.callee.name + ": Category has been specified.");

    // Return early if the requested category is already selected
    if (category.getNode().id === this.selectedCategory.getNode().id) {
      return;
    }

    var self = this;
    this.waitForCategory({category: category}, function () {
      self._controller.click(category);
    });
  },

  /**
   * Select the category with the given id
   *
   * @param {object} aSpec
   *        Information for selecting a category
   *        Elements: id - Category id (search, discover, locale,
   *                       extension, theme, plugin,
   *                       availableUpdates, recentUpdates)
   */
  setCategoryById : function AddonsManager_setCategoryById(aSpec) {
    var spec = aSpec || { };
    var id = spec.id;
    assert.ok(id, arguments.callee.name + ": Category ID has been specified.");

    // Retrieve the category and set it as active
    var category = this.getCategoryById({id: id});
    if (category)
      this.setCategory({category: category});
    else
      assert.fail("Category '" + id + " not found.");
  },

  /**
   * Wait until the specified category has been selected
   *
   * @param {object} aSpec
   *        Object with parameters for customization
   *        Elements: category - Category element to wait for
   * @param {Function} aActionCallback
   *        Callback function which triggers the category pane change
   */
  waitForCategory : function AddonsManager_waitForCategory(aSpec, aActionCallback) {
    var spec = aSpec || { };
    var category = spec.category;
    assert.ok(category, arguments.callee.name + ": Category has been specified.");

    // For the panes 'discover' and 'search' we have to increase the timeout
    // because the ViewChanged event is sent after the remote data has been loaded.
    var categoryId = this.getCategoryId({category: category});
    var timeout = (categoryId === "discover" || categoryId === "search") ? TIMEOUT_REMOTE
                                                                         : undefined;

    // Add event listener to wait until the view has been changed
    var self = { changed: false };
    function onViewChanged() { self.changed = true; }
    this.controller.window.document.addEventListener("ViewChanged",
                                                     onViewChanged, false);

    try {
      aActionCallback();

      assert.waitFor(function () {
        return self.changed;
      }, "Category has been changed.", timeout, undefined, this);
    }
    finally {
      this.controller.window.document.removeEventListener("ViewChanged",
                                                          onViewChanged, false);
    }

    assert.equal(this.selectedCategory.getNode(), category.getNode(),
                 "Target category has not been set - got '" +
                 this.getCategoryId({category: this.selectedCategory}) +
                 "', expected: '" + categoryId + "'");
  },

  ///////////////////////////////
  // Search section
  ///////////////////////////////

  /**
   * Clear the search field
   */
  clearSearchField : function AddonsManager_clearSearchField() {
    var textbox = this.getElement({type: "search_textbox"});
    var cmdKey = utils.getEntity(this.dtds, "selectAllCmd.key");

    this._controller.keypress(textbox, cmdKey, {accelKey: true});
    this._controller.keypress(textbox, 'VK_DELETE', {});
  },

  /**
   * Search for a specified add-on
   *
   * @param {object} aSpec
   *        Information to execute the search
   *        Elements: value   - Search term
   *                  timeout - Duration to wait for search results
   *                            [optional - default: 30s]
   */
  search : function AddonsManager_search(aSpec) {
    var spec = aSpec || { };
    var value = spec.value;
    var timeout = spec.timeout;
    var category = this.getCategoryById({id: "search"});

    assert.ok(value, arguments.callee.name + ": Search term has been specified.");

    var self = this;
    this.waitForCategory({category : category}, function () {
      self.clearSearchField();

      var textbox = self.getElement({type: "search_textbox"});
      self._controller.type(textbox, value);
      self._controller.keypress(textbox, "VK_RETURN", {});
    });
  },

  /**
   * Check if a search is active
   *
   * @returns State of the search
   * @type {boolean}
   */
  get isSearching() {
    var throbber = this.getElement({type: "search_throbber"});
    return !throbber.getNode().hasAttribute("hidden");
  },

  /**
   * Retrieve the currently selected search filter
   *
   * @returns Element which represents the currently selected search filter
   * @type {ElemBase}
   */
  get selectedSearchFilter() {
    var filter = this.getSearchFilter({attribute: "selected", value: "true"});

    return (filter.length > 0) ? filter[0] : undefined;
  },

  /**
   * Set the currently selected search filter status
   *
   * @param {string} aValue
   *        Filter for the search results (local, remote)
   */
  set selectedSearchFilter(aValue) {
    var filter = this.getSearchFilter({attribute: "value", value: aValue});

    assert.notEqual(SEARCH_FILTER.indexOf(aValue), -1,
                    arguments.callee.name + ": '" + aValue +
                    "' is a valid search filter");

    if (filter.length > 0) {
      this._controller.click(filter[0]);
      this.waitForSearchFilter({filter: filter[0]});
    }
  },

  /**
   * Returns the available search filters which match the filter criteria
   *
   * @param {object} aSpec
   *        Information about the filter to apply
   *        Elements: attribute - DOM attribute of the wanted filter
   *                              [optional - default: ""]
   *                  value     - Value of the DOM attribute
   *                              [optional - default: ""]
   *
   * @returns List of search filters
   * @type {array of ElemBase}
   */
  getSearchFilter : function AddonsManager_getSearchFilter(aSpec) {
    var spec = aSpec || { };

    return this.getElements({
      type: "search_filterRadioButtons",
      subtype: spec.attribute,
      value: spec.value
    });
  },

  /**
   * Get the search filter element for the specified value
   *
   * @param {string} aValue
   *        Search filter value (local, remote)
   *
   * @returns Search filter element
   * @type {ElemBase}
   */
  getSearchFilterByValue : function AddonsManager_getSearchFilterByValue(aValue) {
    assert.ok(aValue, arguments.callee.name + ": Search filter value has been specified.");

    return this.getElement({
      type: "search_filterRadioGroup",
      subtype: "value",
      value: aValue
    });
  },

  /**
   * Get the value of the given search filter element
   *
   * @param {object} aSpec
   *        Information for getting the views matched by the criteria
   *        Elements: filter - Filter element
   *
   * @returns Value of the search filter
   * @type {string}
   */
  getSearchFilterValue : function AddonsManager_getSearchFilterValue(aSpec) {
    var spec = aSpec || { };
    var filter = spec.filter;
    assert.ok(filter, arguments.callee.name + ": Search filter has been specified.");

    return filter.getNode().value;
  },

  /**
   * Waits until the specified search filter has been selected
   *
   * @param {object} aSpec
   *        Object with parameters for customization
   *        Elements: filter  - Filter element to wait for
   *                  timeout - Duration to wait for the target state
   *                            [optional - default: 5s]
   */
  waitForSearchFilter : function AddonsManager_waitForSearchFilter(aSpec) {
    var spec = aSpec || { };
    var filter = spec.filter;
    var timeout = spec.timeout;

    assert.ok(filter, arguments.callee.name + ": Search filter has been specified.");

    assert.waitFor(function () {
      return this.selectedSearchFilter.getNode() === filter.getNode();
    }, "Search filter '" + filter.getNode().value + "' has been set", timeout,
       undefined, this);
  },

  /**
   * Returns the list of add-ons found by the selected filter
   *
   * @returns List of add-ons
   * @type {ElemBase}
   */
  getSearchResults : function AddonsManager_getSearchResults() {
    var filterValue = this.getSearchFilterValue({
      filter: this.selectedSearchFilter
    });

    switch (filterValue) {
      case "local":
        return this.getAddons({attribute: "status", value: "installed"});
      case "remote":
        return this.getAddons({attribute: "remote", value: "true"});
      default:
        assert.fail("Unknown search filter '" +
                    filterValue + "' selected");
    }
  },


  ///////////////////////////////
  // View section
  ///////////////////////////////

  /**
   * Returns the views which match the filter criteria
   *
   * @param {object} aSpec
   *        Information for getting the views matched by the criteria
   *        Elements: attribute - DOM attribute of the node
   *                              [optional - default: ""]
   *                  value     - Value of the DOM attribute
   *                              [optional - default: ""]
   *
   * @returns Filtered list of views
   * @type {array of ElemBase}
   */
  getViews : function AddonsManager_getViews(aSpec) {
    var spec = aSpec || { };
    var attribute = spec.attribute;
    var value = spec.value;

    return this.getElements({type: "views", subtype: attribute, value: value});
  },

  /**
   * Check if the details view is active
   *
   * @returns True if the default view is selected
   * @type {boolean}
   */
  get isDetailViewActive() {
    return (this.selectedView.getNode().id == "detail-view");
  },

  /**
   * Retrieve the currently used view
   *
   * @returns Element which represents the currently selected view
   * @type {ElemBase}
   */
  get selectedView() {
    var viewDeck = this.getElement({type: "viewDeck"});
    var views = this.getViews();

    return views[viewDeck.getNode().selectedIndex];
  },


  ///////////////////////////////
  // UI Elements section
  ///////////////////////////////

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Element which has been found
   * @type {ElemBase}
   */
  getElement : function AddonsManager_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Elements which have been found
   * @type {array of ElemBase}
   */
  getElements : function AddonsManager_getElements(aSpec) {
    var spec = aSpec || { };
    var type = spec.type;
    var subtype = spec.subtype;
    var value = spec.value;
    var parent = spec.parent;

    var root = parent ? parent.getNode() : this._controller.tabs.activeTab;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch (type) {
      // Add-ons
      case "addons":
        nodeCollector.queryNodes(".addon").filterByDOMProperty(subtype, value);
        break;
      case "addonsList":
        nodeCollector.queryNodes("#addon-list");
        break;
      case "allResults":
        nodeCollector.queryNodes("#search-allresults-link");
        break;
      // Categories
      case "categoriesList":
        nodeCollector.queryNodes("#categories");
        break;
      case "categories":
        nodeCollector.queryNodes(".category").filterByDOMProperty(subtype, value);
        break;
      // Get Add-ons
      case "discoveryPane":
        nodeCollector.queryNodes("#discover-browser");
        break;
      // Detail view
      case "detailView_element":
        nodeCollector.queryNodes(value);
        break;
      case "detailView_stateMenu":
        nodeCollector.queryNodes("#detail-state-menulist");
        break;
      case "detailView_disableButton":
        nodeCollector.queryNodes("#detail-disable-btn");
        break;
      case "detailView_enableButton":
        nodeCollector.queryNodes("#detail-enable-btn");
        break;
      case "detailView_installButton":
        nodeCollector.queryNodes("#detail-install-btn");
        break;
      case "detailView_preferencesButton":
        nodeCollector.queryNodes("#detail-prefs-btn");
        break;
      case "detailView_purchaseButton":
        nodeCollector.queryNodes("#detail-purchase-btn");
        break;
      case "detailView_removeButton":
        nodeCollector.queryNodes("#detail-uninstall-btn");
        break;
      case "detailView_findUpdatesLink":
        nodeCollector.queryNodes("#detail-findUpdates-btn");
        break;
      case "detailView_restartLink":
        nodeCollector.queryNodes("#detail-restart-btn");
        break;
      case "detailView_undoLink":
        nodeCollector.queryNodes("#detail-undo-btn");
        break;
      case "detailView_findUpdatesRadiogroup":
        nodeCollector.queryNodes("#detail-findUpdates");
        break;
      // List view
      case "listView_element":
        nodeCollector.queryAnonymousNode(subtype, value);
        break;
      case "listView_stateMenu":
        nodeCollector.queryAnonymousNode("anonid", "state-menulist");
        break;
      case "listView_disableButton":
        nodeCollector.queryAnonymousNode("anonid", "disable-btn");
        break;
      case "listView_enableButton":
        nodeCollector.queryAnonymousNode("anonid", "enable-btn");
        break;
      case "listView_installButton":
        // There is another binding we will have to skip
        nodeCollector.queryAnonymousNode("anonid", "install-status");
        nodeCollector.root = nodeCollector.nodes[0];
        nodeCollector.queryAnonymousNode("anonid", "install-remote");
        break;
      case "listView_preferencesButton":
        nodeCollector.queryAnonymousNode("anonid", "preferences-btn");
        break;
      case "listView_removeButton":
        nodeCollector.queryAnonymousNode("anonid", "remove-btn");
        break;
      case "listView_moreLink":
        nodeCollector.queryAnonymousNode("class", "details button-link");
        break;
      case "listView_pluginCheckLink":
        nodeCollector.queryNodes(".global-info-plugincheck");
        break;
      case "listView_restartLink":
        nodeCollector.queryAnonymousNode("anonid", "restart-btn");
        break;
      case "listView_undoLink":
        nodeCollector.queryAnonymousNode("anonid", "undo-btn");
        break;
      case "listView_cancelDownload":
        // There is another binding we will have to skip
        nodeCollector.queryAnonymousNode("anonid", "install-status");
        nodeCollector.root = nodeCollector.nodes[0];
        nodeCollector.queryAnonymousNode("anonid", "cancel");
        break;
      case "listView_pauseDownload":
        // There is another binding we will have to skip
        nodeCollector.queryAnonymousNode("anonid", "install-status");
        nodeCollector.root = nodeCollector.nodes[0];
        nodeCollector.queryAnonymousNode("anonid", "pause");
        break;
      case "listView_progressDownload":
        // There is another binding we will have to skip
        nodeCollector.queryAnonymousNode("anonid", "install-status");
        nodeCollector.root = nodeCollector.nodes[0];
        nodeCollector.queryAnonymousNode("anonid", "progress");
        break;
      // Search
      // Bug 599775
      // Controller needs to handle radio groups correctly
      // Means for now we have to use the radio buttons
      case "search_filterRadioButtons":
        nodeCollector.queryNodes(".search-filter-radio").filterByDOMProperty(subtype, value);
        break;
      case "search_filterRadioGroup":
        nodeCollector.queryNodes("#search-filter-radiogroup");
        break;
      case "search_textbox":
        nodeCollector.queryNodes("#header-search");
        break;
      case "search_list":
        nodeCollector.queryNodes("#search-list");
        break;
      case "search_throbber":
        nodeCollector.queryNodes("#search-loading");
        break;
      // Utils
      case "utilsButton":
        nodeCollector.queryNodes("#header-utils-btn");
        break;
      case "utilsButton_menu":
        nodeCollector.queryNodes("#utils-menu");
        break;
      case "utilsButton_menuItem":
        nodeCollector.queryNodes(value);
        break;
      // Views
      case "viewDeck":
        nodeCollector.queryNodes("#view-port");
        break;
      case "views":
        nodeCollector.queryNodes(".view-pane").filterByDOMProperty(subtype, value);
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  }
};

/**
 * @class Class to handle the addons.mozilla.org webpage
 * @constructor
 * @param {MozMillController} aBrowserController
 *        Controller of the browser window
 */
function AMOAddonPage(aBrowserController) {
  this._controller = aBrowserController;
}

AMOAddonPage.prototype = {

  /**
   * Get the controller of the window
   *
   * @returns {MozMillController} Mozmill Controller
   */
  get controller() {
    return this._controller;
  },

  ///////////////////////////////
  // UI Elements section
  ///////////////////////////////

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Element which has been found
   * @type {ElemBase}
   */
  getElement : function AMOAddonPage_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve the UI elements based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Elements which have been found
   * @type {array of ElemBase}
   */
  getElements : function AMOAddonPage_getElements(aSpec) {
    var spec = aSpec || { };
    var type = spec.type;

    var root = spec.parent ? spec.parent.getNode() : this._controller.tabs.activeTab;

    switch (type) {
      case "install-button":
        return [findElement.Selector(root, ".install-button > a")];
      default:
        assert.fail("Unknown element type - " + spec.type);
    }
  }
}


/**
 * @class Class to handle the Discovery Pane
 * @constructor
 * @param {MozMillController} aBrowserController Controller of the browser window
 * @param {ChromeWindow} aWindow Window of the embedded browser element.
 */
function DiscoveryPane(aBrowserController, aWindow) {
  this._controller = aBrowserController;
  this._window = aWindow;
}


DiscoveryPane.prototype = {

  /**
   * Get the controller of the window
   *
   * @returns {MozMillController} Mozmill Controller
   */
  get controller() {
    return this._controller;
  },

  /**
   * Check if the URL contains the specified SRC attribute
   *
   * @param {ElemBase} aElement Element to check for the install source
   * @returns {String} The installation source
   */
  getInstallSource : function DiscoveryPane_getInstallSource(aElement) {
    // Retrieve the id of the installation source, i.e. 'src=discovery-pane'
    var source = /.*src=([^&]+)/.exec(aElement.getNode().href);

    return source.length ? source[1] : "";
  },

  /**
   * Wait until the content of the Discovery Pane has been loaded
   */
  waitForPageLoad : function DiscoveryPane_waitForPageLoad(aTimeout, aDelay) {
    this._controller.waitForPageLoad(this._window.document, aTimeout, aDelay);
  },

  ///////////////////////////////
  // Sections
  ///////////////////////////////

  /**
   * Get the given section on the main page.
   *
   * @param {String} aId
   *        ID of the section (main-feature, featured-addons, recs, up-and-coming,
   *                           featured-personas, more-ways)
   *
   * @returns {ElemBase} The section
   */
  getSection : function DiscoveryPane_getSection(aId) {
    return this.getElement({type: "sections",
                            subtype: "id",
                            value: aId});
  },

  /**
   * Get the list of all available sections on the main page.
   *
   * @returns {Array} List of elements found.
   */
  getSections : function DiscoveryPane_getSections() {
    return this.getElements({type: "sections"});
  },

  ///////////////////////////////
  // UI Elements section
  ///////////////////////////////

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Element which has been found
   * @type {ElemBase}
   */
  getElement : function DiscoveryPane_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Elements which have been found
   * @type {array of ElemBase}
   */
  getElements : function DiscoveryPane_getElements(aSpec) {
    var spec = aSpec || { };
    var type = spec.type;
    var subtype = spec.subtype;
    var value = spec.value;
    var parent = spec.parent;

    var root = parent ? parent.getNode() : this._window.document;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch (type) {
      // Main page
      case "sections":
        nodeCollector.queryNodes("section section").filterByDOMProperty(subtype, value);
        break;
      case "featuredAddons_addons":
        nodeCollector.queryNodes("li .addon-title");
        break;
      case "featuredPersonas_seeAllLink":
        nodeCollector.queryNodes("a.all");
        break;
      case "featuredPersonas_addons":
        nodeCollector.queryNodes(".persona-list .persona-preview>a");
        break;
      case "mainFeature_nextLink":
        nodeCollector.queryNodes("#nav-features a.next");
        break;
      case "mainFeature_prevLink":
        nodeCollector.queryNodes("#nav-features a.prev");
        break;
      case "mainFeature_firstTimeAddons":
        nodeCollector.queryNodes("#starter .addons li>a");
        break;
      case "mainFeature_collectionAddons":
        nodeCollector.queryNodes("#fx4-collection .addons li>a");
        break;
      case "mainFeature_ryfLearnMore":
        nodeCollector.queryNodes(".ryff .more>a");
        break;
      case "mainFeature_pickMonthInstall":
        nodeCollector.queryNodes("#monthly .install-button>a");
        break;
      case "mainFeature_mobileGetAddons":
        nodeCollector.queryNodes("li[class='panel'] #go-mobile a.add");
        break;
      case "moreWays_browseExtensions":
        nodeCollector.queryNodes("#more-addons>a");
        break;
      case "moreWays_browseThemes":
        nodeCollector.queryNodes("#more-personas>a");
        break;
      case "recommendedAddons_whatIsIt":
        nodeCollector.queryNodes(".header a");
        break;
      case "recommendedAddons_addons":
        nodeCollector.queryNodes(".gallery-addons .addon-feature>a");
        break;
      case "upAndComing_seeAllLink":
        nodeCollector.queryNodes("a.all");
        break;
      case "upAndComing_addons":
        nodeCollector.queryNodes("li .addon-title");
        break;
      // Addon page
      case "addon_backLink":
        nodeCollector.queryNodes("#back a");
        break;
      case "addon_installButton":
        nodeCollector.queryNodes(".install-button a");

        // Bug 668976
        // No easy way to handle the multiple platform case. We have to filter
        // by the final computed CSS style for the element
        if (nodeCollector.nodes.length > 1)
          nodeCollector.filterByCSSProperty("display", "inline-block");
        break;
      case "addon_learnMoreButton":
        nodeCollector.queryNodes("#learn-more");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  }
}


/**
 * Whitelist permission for the specified domain
 * @param {string} aDomain
 *        The domain to add the permission for
 */
function addToWhiteList(aDomain) {
  Services.perms.add(utils.createURI(aDomain), "install",
                     Ci.nsIPermissionManager.ALLOW_ACTION);
}

/**
 * Cancel extension installations
 */
function cancelAddonInstallations() {
  AddonManager.getAllInstalls(function (aInstalls) {
    for (var i = 0; i < aInstalls.length; i++) {
      aInstalls[i].cancel();
    }
  });
}

/**
 * Disables an addon using back-end code
 *
 * @param {string} aAddonId Id for the addon to be disabled
 */
function disableAddon(aAddonId) {
  var finished = false;

  // Disable addon using the AddonManager Component
  AddonManager.getAddonByID(aAddonId, function (aAddon) {
    aAddon.userDisabled = true;
    finished = true;
  });

  expect.waitFor(function () {
    return finished;
  }, "Addon " + aAddonId + " has been disabled");
}

/**
 * Enables an addon using back-end code
 *
 * @param {string} aAddonId Id for the addon to be enabled
 */
function enableAddon(aAddonId) {
  var finished = false;

  // Enable addon using the AddonManager Component
  AddonManager.getAddonByID(aAddonId, function (aAddon) {
    aAddon.userDisabled = false;
    finished = true;
  });

  assert.waitFor(function () {
    return finished;
  }, "Addon " + aAddonId + " has been enabled");
}

/**
 * Gets all installed add-ons
 *
 * @param {Function} [aCallbackFilter]
 *        If not provided the unfiltered add-ons will be returned.
 *        If provided, the callback filter takes an argument of an Addon object
 *        as documented at https://developer.mozilla.org/en/Addons/Add-on_Manager/Addon
 *        and returns a filtered version.
 */
function getInstalledAddons(aCallbackFilter) {
  let addonInfo = null;

  AddonManager.getAllAddons(function (aAddons) {
    if (aCallbackFilter == undefined) {
      addonInfo = aAddons;
    }
    else {
      addons = [];
      aAddons.forEach(function (aAddon) {
        var result = aCallbackFilter(aAddon);
        if (result)
          addons.push(result);
      });
      addonInfo = addons;
    }
  });

 assert.waitFor(function () {
   return !!addonInfo;
 }, "Addons are installed");

 return addonInfo;
}

/**
 * Remove whitelist permission for the specified host
 * @param {string} aHost
 *        The host whose permission will be removed
 */
function removeFromWhiteList(aHost) {
  Services.perms.remove(aHost, "install");
}

/**
 * Reset all preferences which point to the preview sub domain
 */
function resetAmoPreviewUrls() {
  for each (var preference in AMO_PREFERENCES) {
    prefs.clearUserPref(preference.name);
  }
}

/**
 * Reset discovery pane URL to default
 */
function resetDiscoveryPaneURL() {
  prefs.clearUserPref(AMO_DISCOVER_URL);
}

/**
 * Set discovery pane URL
 * @param {object} aUrl
 *        Custom defined URL to load within the 'Get Addons' section
 */
function setDiscoveryPaneURL(aUrl) {
  prefs.setPref(AMO_DISCOVER_URL, aUrl);
}

/**
 * Retrieve information from installed add-ons and send it to Mozmill
 */
function submitInstalledAddons() {
  frame.events.fireEvent('installedAddons',
    getInstalledAddons(function (aAddon) {
      return {
        id : aAddon.id,
        type : aAddon.type,
        name : aAddon.name,
        version : aAddon.version,
        isActive : aAddon.isActive,
        isCompatible : aAddon.isCompatible
      }
    })
  );
}

/**
 *  Updates all necessary preferences to the preview sub domain
 */
function useAmoPreviewUrls() {
  for each (var preference in AMO_PREFERENCES) {
    var pref = prefs.getPref(preference.name, "");
    prefs.setPref(preference.name,
                  pref.replace(preference.old, preference.new));
  }
}

/**
 * Handles the modal dialog to install an add-on
 *
 * @param {MozMillController} aController
 */
function handleInstallAddonDialog(aController) {
  // Get the install button
  var nodeCollector = new domUtils.nodeCollector(aController.window);
  nodeCollector.queryNodes("#xpinstallConfirm");
  nodeCollector.root = nodeCollector.nodes[0];
  nodeCollector.queryAnonymousNode("dlgtype", "accept");

  // Wait for the install button to be enabled
  var installButton = nodeCollector.elements[0];

  assert.waitFor(function () {
    return !installButton.getNode().disabled;
  }, "Install button is enabled");

  // Click the install button
  aController.click(installButton);
}

// Export of variables
exports.AMO_DISCOVER_URL = AMO_DISCOVER_URL;
exports.AMO_DOMAIN = AMO_DOMAIN;

// Export of functions
exports.addToWhiteList = addToWhiteList;
exports.cancelAddonInstallations = cancelAddonInstallations;
exports.disableAddon = disableAddon;
exports.enableAddon = enableAddon;
exports.getInstalledAddons = getInstalledAddons;
exports.handleInstallAddonDialog = handleInstallAddonDialog;
exports.removeFromWhiteList = removeFromWhiteList;
exports.resetAmoPreviewUrls = resetAmoPreviewUrls;
exports.resetDiscoveryPaneURL = resetDiscoveryPaneURL;
exports.setDiscoveryPaneURL = setDiscoveryPaneURL;
exports.submitInstalledAddons = submitInstalledAddons;
exports.useAmoPreviewUrls = useAmoPreviewUrls;

// Export of classes
exports.AddonsManager = AddonsManager;
exports.AMOAddonPage = AMOAddonPage;
