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
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Geo Mealer <gmealer@mozilla.com>
 *   Remus Pop <remus.pop@softvision.ro>
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

Components.utils.import("resource://gre/modules/AddonManager.jsm");

// Include required modules
var domUtils = require("dom-utils");
var prefs = require("prefs");
var tabs = require("tabs");
var utils = require("utils");


const TIMEOUT = 5000;
const TIMEOUT_DOWNLOAD = 15000;
const TIMEOUT_REMOTE = 30000;

var pm = Cc["@mozilla.org/permissionmanager;1"].
         getService(Ci.nsIPermissionManager);

// AMO Preferences
const AMO_DISCOVER_URL = 'extensions.webservice.discoverURL';

// AMO Preview site
const AMO_PREVIEW_DOMAIN = "addons-dev.allizom.org";
const AMO_PREVIEW_SITE = "https://" + AMO_PREVIEW_DOMAIN;

// Available search filters
const SEARCH_FILTER = [
  "local",
  "remote"
];

// Preferences which have to be changed to make sure we do not interact with the
// official AMO page but the preview site instead
const AMO_PREFERENCES = [
  {name: "extensions.getAddons.browseAddons", old: "addons.mozilla.org", new: AMO_PREVIEW_DOMAIN},
  {name: "extensions.getAddons.recommended.browseURL", old: "addons.mozilla.org", new: AMO_PREVIEW_DOMAIN},
  {name: "extensions.getAddons.recommended.url", old: "services.addons.mozilla.org", new: AMO_PREVIEW_DOMAIN},
  {name: "extensions.getAddons.search.browseURL", old: "addons.mozilla.org", new: AMO_PREVIEW_DOMAIN},
  {name: "extensions.getAddons.search.url", old: "services.addons.mozilla.org", new: AMO_PREVIEW_DOMAIN},
  {name: "extensions.getMoreThemesURL", old: "addons.mozilla.org", new: AMO_PREVIEW_DOMAIN}
];

/**
 * Constructor
 */
function AddonsManager(aController) {
  this._controller = aController;
  this._tabBrowser = new tabs.tabBrowser(this._controller);
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

    if (this.selectedCategory.getNode() !== getAddons.getNode())
      throw new Error("To get an instance of the Discovery Pane the " +
                      "'Get Add-ons pane has to be selected.");

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
    var spec = aSpec || { };
    var type = (spec.type == undefined) ? "menu" : spec.type;
    var waitFor = (spec.waitFor == undefined) ? true : spec.waitFor;

    switch (type) {
      case "menu":
        var menuItem = new elementslib.Elem(this._controller.
                                            menus["tools-menu"].menu_openAddons);
        this._controller.click(menuItem);
        break;
      case "shortcut":
        var cmdKey = utils.getEntity(this.dtds, "addons.commandkey");
        this._controller.keypress(null, cmdKey, {accelKey: true, shiftKey: true});
        break;
      default:
        throw new Error(arguments.callee.name + ": Unknown event type - " +
                        event.type);
    }

    return waitFor ? this.waitForOpened() : null;
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
    var timeout = (spec.timeout == undefined) ? TIMEOUT : spec.timeout;

    mozmill.utils.waitFor(function() {
      return this.isOpen;
    }, "Add-ons Manager has been opened", timeout, undefined, this);

    // The first tab found will be the selected one
    var tab = this.getTabs()[0];
    tab.controller.waitForPageLoad();

    return tab;
  },

  /**
   * Close the Addons Manager
   *
   * @param {object} aSpec
   *        Information about the event to send
   *        Elements: type - Event type (closeButton, menu, middleClick, shortcut)
   */
  close : function AddonsManager_close(aSpec) {
    this._tabBrowser.closeTab(aSpec);
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

    if (!item)
      throw new Error(arguments.callee.name + ": Menu item not specified.");

    var button = this.getElement({type: "utilsButton"});
    var menu = this.getElement({type: "utilsButton_menu"});

    try {
      this._controller.click(button);

      // Click the button and wait until menu has been opened
      mozmill.utils.waitFor(function() {
        return menu.getNode() && menu.getNode().state === "open";
      }, "Menu of utils button has been opened.");

      // Click the given menu entry and make sure the 
      var menuItem = this.getElement({
        type: "utilsButton_menuItem",
        value: "#utils-" + item
      });

      this._controller.click(menuItem);
    } finally {
      // Make sure the menu has been closed
      this._controller.keypress(menu, "VK_ESCAPE", {});

      mozmill.utils.waitFor(function() {
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

    if (!addon)
      throw new Error(arguments.callee.name + ": Add-on not specified.");

    // XXX: Bug 599702 doens't give enough information which type of notification
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

    if (!addon)
      throw new Error(arguments.callee.name + ": Add-on not specified.");

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

    if (!addon)
      throw new Error(arguments.callee.name + ": Add-on not specified.");

    // Bug 600502 : Add-ons in search view are not initialized correctly
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
    spec.button = "enable";

    var button = this.getAddonButton(spec);
    this._controller.click(button);
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
    spec.button = "disable";

    var button = this.getAddonButton(spec);
    this._controller.click(button);
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

    var button = this.getAddonButton(spec);
    this._controller.click(button);
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

    var link = this.getAddonLink(spec);
    this._controller.click(link);
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

    if (!button)
      throw new Error(arguments.callee.name + ": Button not specified.");

    return this.getAddonChildElement({addon: addon, type: button + "Button"});
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

    if (!link)
      throw new Error(arguments.callee.name + ": Link not specified.");

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

    if (!radiogroup)
      throw new Error(arguments.callee.name + ": Radiogroup not specified.");

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

    if (!addon)
      throw new Error(arguments.callee.name + ": Add-on not specified.");

    // If no type has been set retrieve a general element which needs an
    // attribute and value
    if (!type) {
      type = "element";

      if (!attribute)
        throw new Error(arguments.callee.name + ": DOM attribute not specified.");
      if (!value)
        throw new Error(arguments.callee.name + ": Value not specified.");
    }

    // For the details view the elements don't have anonymous nodes
    if (this.selectedView.getNode().id == "detail-view") {
      return this.getElement({
        type: "detailView_" + type,
        subtype: attribute,
        value: value
      });
    } else {
      return this.getElement({
        type: "listView_" + type,
        subtype: attribute,
        value: value,
        parent: addon
      });
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

    if (!addon)
      throw new Error(arguments.callee.name + ": Add-on not specified.");

    var self = this;
    var node = addon.getNode();

    mozmill.utils.waitFor(function () {
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

    if (categories.length == 0)
      throw new Error(arguments.callee.name + ": Categories could not be found.");

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

    if (!id)
      throw new Error(arguments.callee.name + ": Category ID not specified.");

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

    if (!category)
      throw new Error(arguments.callee.name + ": Category not specified.");

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

    if (!category)
      throw new Error(arguments.callee.name + ": Category not specified.");

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
   *        Elements: id      - Category id (search, discover, languages,
   *                            searchengines, extensions, themes, plugins,
   *                            availableUpdates, recentUpdates)
   */
  setCategoryById : function AddonsManager_setCategoryById(aSpec) {
    var spec = aSpec || { };
    var id = spec.id;

    if (!id)
      throw new Error(arguments.callee.name + ": Category ID not specified.");

    // Retrieve the category and set it as active
    var category = this.getCategoryById({id: id});
    if (category)
      this.setCategory({category: category});
    else
      throw new Error(arguments.callee.name + ": Category '" + id + " not found.");
  },

  /**
   * Wait until the specified category has been selected
   * 
   * @param {object} aSpec
   *        Object with parameters for customization
   *        Elements: category - Category element to wait for
   *                  timeout - Duration to wait for the target state
   *                            [optional - default: 5s]
   * @param {Function} aActionCallback
   *        Callback function which triggers the category pane change
   */
  waitForCategory : function AddonsManager_waitForCategory(aSpec, aActionCallback) {
    var spec = aSpec || { };
    var category = spec.category;
    var categoryId = this.getCategoryId({category: category});
    var timeout = spec.timeout || TIMEOUT;

    if (!category)
      throw new Error(arguments.callee.name + ": Category not specified.");

    // For the panes 'discover' and 'search' we have to increase the timeout
    // because the ViewChanged event is sent after the remote data has been loaded.
    if (categoryId === 'discover' || categoryId === 'search')
      timeout = TIMEOUT_REMOTE;

    // Add event listener to wait until the view has been changed
    var self = { changed: false };
    function onViewChanged() { self.changed = true; }
    this.controller.window.document.addEventListener("ViewChanged",
                                                     onViewChanged, false);

    try {
      aActionCallback();

      this.controller.waitFor(function () {
        return self.changed;
      }, "Category has been changed.", timeout, undefined, this);
    } finally {
      this.controller.window.document.removeEventListener("ViewChanged",
                                                          onViewChanged, false);
    }

    if (this.selectedCategory.getNode() !== category.getNode())
      throw new Error("Target category has not been set - got '" +
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

    if (!value)
      throw new Error(arguments.callee.name + ": Search term not specified.");

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

    if (SEARCH_FILTER.indexOf(aValue) == -1)
      throw new Error(arguments.callee.name + ": '" + aValue +
                      "' is not a valid search filter");

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
    if (!aValue)
      throw new Error(arguments.callee.name + ": Search filter value not specified.");

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

    if (!filter)
      throw new Error(arguments.callee.name + ": Search filter not specified.");

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
    var timeout = (spec.timeout == undefined) ? TIMEOUT : spec.timeout;

    if (!filter)
      throw new Error(arguments.callee.name + ": Search filter not specified.");

    mozmill.utils.waitFor(function () {
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
        throw new Error(arguments.callee.name + ": Unknown search filter '" +
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
        nodeCollector.queryAnonymousNodes(subtype, value);
        break;
      case "listView_disableButton":
        nodeCollector.queryAnonymousNodes("anonid", "disable-btn");
        break;
      case "listView_enableButton":
        nodeCollector.queryAnonymousNodes("anonid", "enable-btn");
        break;
      case "listView_installButton":
        // There is another binding we will have to skip
        nodeCollector.queryAnonymousNodes("anonid", "install-status");
        nodeCollector.root = nodeCollector.nodes[0];
        nodeCollector.queryAnonymousNodes("anonid", "install-remote");
        break;
      case "listView_preferencesButton":
        nodeCollector.queryAnonymousNodes("anonid", "preferences-btn");
        break;
      case "listView_removeButton":
        nodeCollector.queryAnonymousNodes("anonid", "remove-btn");
        break;
      case "listView_moreLink":
        nodeCollector.queryAnonymousNodes("class", "details button-link");
        break;
      case "listView_pluginCheckLink":
        nodeCollector.queryNodes(".global-info-plugincheck");
        break;
      case "listView_restartLink":
        nodeCollector.queryAnonymousNodes("anonid", "restart-btn");
        break;
      case "listView_undoLink":
        nodeCollector.queryAnonymousNodes("anonid", "undo-btn");
        break;
      case "listView_cancelDownload":
        // There is another binding we will have to skip
        nodeCollector.queryAnonymousNodes("anonid", "install-status");
        nodeCollector.root = nodeCollector.nodes[0];
        nodeCollector.queryAnonymousNodes("anonid", "cancel");
        break;
      case "listView_pauseDownload":
        // There is another binding we will have to skip
        nodeCollector.queryAnonymousNodes("anonid", "install-status");
        nodeCollector.root = nodeCollector.nodes[0];
        nodeCollector.queryAnonymousNodes("anonid", "pause");
        break;
      case "listView_progressDownload":
        // There is another binding we will have to skip
        nodeCollector.queryAnonymousNodes("anonid", "install-status");
        nodeCollector.root = nodeCollector.nodes[0];
        nodeCollector.queryAnonymousNodes("anonid", "progress");
        break;
      // Search
      // Bug 599775 - Controller needs to handle radio groups correctly
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
        throw new Error(arguments.callee.name + ": Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  }
};


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

        // XXX: Bug 668976
        //      No easy way to handle the multiple platform case. We have to filter
        //      by the final computed CSS style for the element
        if (nodeCollector.nodes.length > 1)
          nodeCollector.filterByCSSProperty("display", "inline-block");
        break;
      case "addon_learnMoreButton":
        nodeCollector.queryNodes("#learn-more");
        break;
      default:
        throw new Error(arguments.callee.name + ": Unknown element type - " + spec.type);
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
  pm.add(utils.createURI(aDomain),
         "install",
         Ci.nsIPermissionManager.ALLOW_ACTION);
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

  mozmill.utils.waitFor(function () {
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

  mozmill.utils.waitFor(function () {
    return finished;
  }, "Addon " + aAddonId + " has been enabled");
}

/**
 * Gets all installed add-ons
 *
 * @param {Function} [callbackFilter]
 *        If not provided the unfiltered add-ons will be returned.
 *        If provided, the callback filter takes an argument of an Addon object
 *        as documented at https://developer.mozilla.org/en/Addons/Add-on_Manager/Addon
 *        and returns a filtered version.
 */
function getInstalledAddons(callbackFilter) {
  let addonInfo = null;

  AddonManager.getAllAddons(function (aAddons) {
    if (callbackFilter == undefined) {
      addonInfo = aAddons;
    } else {
      addons = [];
      aAddons.forEach(function (addon) {
        addons.push(callbackFilter(addon));
      });
      addonInfo = addons;
    }
  });

 mozmill.utils.waitFor(function () {
   return !!addonInfo;
 });
 
 return addonInfo;
}

/**
 * Remove whitelist permission for the specified host
 * @param {string} aHost
 *        The host whose permission will be removed
 */
function removeFromWhiteList(aHost) { 
  pm.remove(aHost, "install");
}

/**
 * Reset all preferences which point to the preview sub domain
 */
function resetAmoPreviewUrls() {
  var prefSrv = prefs.preferences;

  for each (var preference in AMO_PREFERENCES) {
    prefSrv.clearUserPref(preference.name);
  }
}

/**
 *  Updates all necessary preferences to the preview sub domain
 */
function useAmoPreviewUrls() {
  var prefSrv = prefs.preferences;

  for each (var preference in AMO_PREFERENCES) {
    var pref = prefSrv.getPref(preference.name, "");
    prefSrv.setPref(preference.name,
                    pref.replace(preference.old, preference.new));
  }
}

/**
 * Handles the modal dialog to install an add-on
 *
 * @param {MozMillController} MozMill Controller
 */
function handleInstallAddonDialog(aController) {
  // Get the install button
  var nodeCollector = new domUtils.nodeCollector(aController.window);
  nodeCollector.queryNodes("#xpinstallConfirm");
  nodeCollector.root = nodeCollector.nodes[0];
  nodeCollector.queryAnonymousNodes("dlgtype", "accept");

  // Wait for the install button to be enabled
  var installButton = nodeCollector.elements[0];

  mozmill.utils.waitFor(function () {
    return !installButton.getNode().disabled;
  }, "Install button is enabled");

  // Click the install button
  aController.click(installButton);
}   

// Export of variables
exports.AMO_DISCOVER_URL = AMO_DISCOVER_URL;
exports.AMO_PREVIEW_DOMAIN = AMO_PREVIEW_DOMAIN;
exports.AMO_PREVIEW_SITE = AMO_PREVIEW_SITE;

// Export of functions
exports.addToWhiteList = addToWhiteList;
exports.disableAddon = disableAddon;
exports.enableAddon = enableAddon;
exports.getInstalledAddons = getInstalledAddons;
exports.handleInstallAddonDialog = handleInstallAddonDialog;
exports.removeFromWhiteList = removeFromWhiteList;
exports.resetAmoPreviewUrls = resetAmoPreviewUrls;
exports.useAmoPreviewUrls = useAmoPreviewUrls;

// Export of classes
exports.AddonsManager = AddonsManager;
