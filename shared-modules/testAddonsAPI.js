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
 * The AddonsAPI adds support for addons related functions. It also gives
 * access to the Addons Manager.
 *
 * @version 1.0.0
 */

var MODULE_NAME = 'AddonsAPI';

const gTimeout = 5000;

/**
 * Constructor
 */
function addonsManager()
{
  this._controller = null;
}

/**
 * Addons Manager class
 */
addonsManager.prototype = {
  get controller() { return this._controller; },

  get searchField() { return new elementslib.ID(this._controller.window.document, "searchfield"); },
  get searchFieldButton() { return new elementslib.Lookup(controller.window.document, '/id("extensionsManager")/id("addonsMsg")/id("extensionsBox")/id("searchPanel")/id("searchfield")/anon({"class":"textbox-input-box"})/anon({"anonid":"search-icons"})'); },

  /**
   * Close the Addons Manager
   */
  close : function addonsManager_close()
  {
    var windowCount = mozmill.utils.getWindows().length;

    this._controller.keypress(null, 'w', {accelKey: true});
    this._controller.waitForEval("subject.getWindows().length == " + (windowCount - 1),
                         gTimeout, 100, mozmill.utils);
  },

  /**
   * Returns the specified item from the richlistbox
   *
   * @param {string} name
   *        nodeName of the wanted richlistitem
   * @param {string} value
   *        nodeValue of the wanted richlistitem
   * @returns Element string of the given list item
   * @type string
   */
  getListItem : function addonsManager_getListItem(name, value) {
    var spec = '{"' + name + '":"' + value + '"}';
    var str = '/id("extensionsManager")/id("addonsMsg")/id("extensionsBox")/' +
              '[1]/id("extensionsView")/' + spec;

    return str;
  },

  /**
   * Retrieve the currently selected pane
   *
   * @returns Id of the currently selected pane
   * @type string
   */
  getPane: function preferencesDialog_getPane()
  {
    var selected = new elementslib.Lookup(this._controller.window.document,
                                          '/id("extensionsManager")/{"orient":"vertical"}/id("topStackBar")/' +
                                          'id("viewGroup")/{"selected":"true"}');

    return /\w+/.exec(selected.getNode().id);
  },

  /**
   * Retrieve the current enabled/disabled state of the given plug-in
   *
   * @param {string} name
   *        Name of the plug-in
   * @returns True if plug-in is enabled
   * @type boolean
   */
  isPluginEnabled : function addonsManager_setPluginState(name) {
    if (this.getPane() != "plugins")
      this.setPane("plugins");

    var plugin = new elementslib.Lookup(this._controller.window.document,
                                        this.getListItem("name", name));

    return (plugin.getNode().getAttribute('isDisabled') == 'true');
  },

  /**
   * Open the Addons Manager
   *
   * @param {MozMillController} controller
   *        MozMillController of the window to operate on
   */
  open : function addonsManager_open(controller)
  {
    if (controller) {
      controller.click(new elementslib.Elem(controller.menus["tools-menu"].menu_openAddons));
      controller.sleep(500);

      var window = mozmill.wm.getMostRecentWindow('Extension:Manager');
      this._controller = new mozmill.controller.MozMillController(window);  

      this._controller.sleep(500);
    } else {
      this._controller = mozmill.getAddonsController();
    }
  },

  /**
   * Search for the given search term inside the "Get Addons" pane
   *
   * @param {string} searchTerm
   *        Term to search for
   */
  search : function addonsManager_search(searchTerm) {
    // Select the search pane and start search
    this.setPane("search");

    this._controller.waitForElement(this.searchField, gTimeout);
    this._controller.type(this.searchField, searchTerm);
    this._controller.keypress(this.searchField, "VK_RETURN", {});
  },

  /**
   * Select the given pane
   *
   * @param {MozMillController} controller
   *        MozMillController of the window to operate on
   * @param {string} buttonId
   *        Id of the pane to select
   */
  setPane: function addonsManager_setPane(paneId) {
    var button = new elementslib.ID(this._controller.window.document,
                                    paneId + "-view");
    this._controller.waitThenClick(button, gTimeout);

    // Strip off the "-views" part of the button id to be able to wait for the selected pane
    this._controller.waitForEval("subject.getPane() == '" + paneId + "'",
                                 gTimeout, 100, this);
  },

  /**
   * Set the state of the given plug-in
   *
   * @param {string} name
   *        Name of the plug-in
   * @param {boolean} enable
   *        True if the plug-in should be enabled.
   */
  setPluginState : function addonsManager_setPluginState(name, enable) {
    if (this.isPluginEnabled(name) == enable)
      return;

    if (this.getPane() != "plugins")
      this.setPane("plugins");

    var itemString = this.getListItem("name", name);
    var plugin = new elementslib.Lookup(this._controller.window.document,
                                        itemString);
    this._controller.click(plugin);

    var button = new elementslib.Lookup(this._controller.window.document,
                                        itemString + '/anon({"flex":"1"})/{"class":"addonTextBox"}' +
                                        '/anon({"anonid":"selectedButtons"})' +
                                        '/{"command":"cmd_' + (enable ? "disable" : "enable") + '"}');
    this._controller.waitThenClick(button, gTimeout);

    this._controller.waitForEval("subject.isPluginEnabled('" + name + "') == " + enable,
                                 gTimeout, 100, this);
  }
};
