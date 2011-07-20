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
 * The Initial Developer of the Original Code is Fidesfit
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  M.-A. Darche <mozdev@cynode.org>  (Original Author)
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
 * This file provides helper methods to access Fidesfit-client addon specific
 * elements.
 */

// Module imports through CommonJS
var prefs = require('../../../../lib/prefs');
var utils = require('../../../../lib/utils');
var modal_dialog = require('../../../../lib/modal-dialog');
var tabs = require('../../../../lib/tabs');

const CONNEXION_CONTAINER_PATH =
  '/id("fidesfit-config-dialog")/id("fidesfit-connexion")';

function FidesfitHelper(controller) {
  this._controller = controller;

  this._tabBrowser = new tabs.tabBrowser(this._controller);
}

FidesfitHelper.prototype = {

  get ACTIVATION_MANUAL_IMAGE_URL() {
    return 'chrome://fidesfit-client/skin/logo-activation-manual.png'; },

  get ACTIVATION_DISABLED_IMAGE_URL() {
    return 'chrome://fidesfit-client/skin/logo-activation-disabled.png'; },

  get SUGGEST_IMAGE_URL() {
    return 'chrome://fidesfit-client/skin/funnel.png'; },

  /**
   * Opens the addon-bar if it exists. Typically it won't do anything for
   * Firefox < 4.0.
   */
  openAddonBarIfExisting: function fidesfitHelper_openAddonBarIfExisting() {
    var addon_bar = new elementslib.ID(
      this._controller.window.document, 'addon-bar');
    var node = addon_bar.getNode();
    if (addon_bar && node) {
      if (node.collapsed == 'true' || node.collapsed == true) {
        this._controller.keypress(null, '/', { accelKey: true });
        // Sadly the cleaner following code doesn't work
        // this._controller.click(new elementslib.ID(
        //   this._controller.window.document, 'view-menu'));
        // this._controller.click(new elementslib.ID(
        //   this._controller.window.document, 'toggle_addon-bar'));
      }
    }
  },

  /**
   * @param {object} namespace
   */
  loadClientJs: function fidesfitHelper_loadClientJs(namespace) {
    // Making the "window" and "top" elements be available.
    // The "window" element is used by the
    // fidesfit.client.triggerUserMessageFetching method.
    // The "top" element is used by the fidesfit.ui.setNotification method.
    window = Cc['@mozilla.org/appshell/window-mediator;1'].
      getService(Ci.nsIWindowMediator).getMostRecentWindow('navigator:browser');
    top = window;

    var js_loader = Cc['@mozilla.org/moz/jssubscript-loader;1'].
      getService(Ci.mozIJSSubScriptLoader);
    // Even if not called directly, we need to load ui.js
    // because it is later on use by client.js.
    js_loader.loadSubScript('chrome://fidesfit-client/content/ui.js',
      { Cc: Cc, Ci: Ci, Cu: Cu, fidesfit: namespace });
    js_loader.loadSubScript('chrome://fidesfit-client/content/client.js',
      { Cc: Cc, Ci: Ci, Cu: Cu, fidesfit: namespace });
  },

  /**
   * Retrieves an UI element based on the given spec
   *
   * @param {object} spec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type {ElemBase}
   */
  getElement: function fidesfitHelper_getElement(spec) {
    var elem = null;
    switch (spec.type) {
    case 'browser-content':
      elem = new elementslib.ID(this._controller.window.document,
                                'content');
      break;
    case 'browser-content-contextmenu':
      elem = new elementslib.ID(this._controller.window.document,
                                'contentAreaContextMenu');
      break;
    case 'statusbar-panel':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-panel');
      break;
    case 'statusbar-activation-image':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-activation');
      break;
    case 'statusbar-indicator':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-indicator');
      break;
    case 'statusbar-info':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-info');
    case 'statusbar-interest':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-interest');
    case 'statusbar-opinion':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-opinion');
      break;
    case 'statusbar-suggest':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-suggest');
      break;
    case 'statusbar-account':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-account');
      break;
    case 'statusbar-menu':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-menu');
      break;
    case 'menuitem-block-url':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-menuitem-block-url');
      break;
    case 'menuitem-block-host':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-menuitem-block-host');
      break;
    case 'menuitem-block-domain':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-menuitem-block-domain');
      break;
    case 'statusbar-config-menuitem':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-statusbar-config-menuitem');
      break;
    case 'user-id-textbox':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-user-id-textbox');
      break;
    case 'user-id-textbox-input':
      elem = new elementslib.Lookup(this._controller.window.document,
        CONNEXION_CONTAINER_PATH +
        '/id("fidesfit-user-id-textbox")/anon({"class":"textbox-input-box"})/anon({"anonid":"input"})');
      break;
    case 'user-password-textbox':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-user-password-textbox');
      break;
    case 'user-password-textbox-input':
      elem = new elementslib.Lookup(this._controller.window.document,
        CONNEXION_CONTAINER_PATH +
        '/id("fidesfit-user-password-textbox")/anon({"class":"textbox-input-box"})/anon({"anonid":"input"})');
      break;
    case 'services-provider-url':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-services-provider-url');
      break;
    case 'services-provider-url-input':
      elem = new elementslib.Lookup(this._controller.window.document,
        CONNEXION_CONTAINER_PATH +
        '/id("fidesfit-services-provider-url")/anon({"class":"textbox-input-box"})/anon({"anonid":"input"})');
      break;
    case 'context-give-opinion-menuitem':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-context-give-opinion-menuitem');
      break;
    case 'opinion-panel':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-opinion-panel');
      break;
    case 'rating-box-cancel-button':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-rating-box-cancel-button');
      break;
    case 'rating-box-post-button':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-rating-box-post-button');
      break;
    case 'rating-3':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-rating-3');
      break;
    case 'input-box':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-input-box');
      break;
    case 'opinion-input':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-opinion-input');
      break;
    case 'debug-report':
      elem = new elementslib.ID(this._controller.window.document,
                                'fidesfit-debug-report');
      break;
    }
    return elem;
  },

  /**
   * TODO: this method always returns "undefined". Why???
   */
  get user_id() {
    prefs.preferences.getPref('extensions.fidesfit-client.user.id', 'Joe');
  },

  get manual_request_mode() {
    prefs.preferences.
      getPref('extensions.fidesfit-client.request_mode.manual');
  },

  set manual_request_mode(manual) {
    prefs.preferences.
      setPref('extensions.fidesfit-client.request_mode.manual', manual);
  },

  setProviderUrl: function fidesfitHelper_setProviderUrl(url) {
    prefs.preferences.setPref(
      'extensions.fidesfit-client.services.provider.url', url);
  },

  closeConfigDialog: function fidesfitHelper_closeConfigDialog(controller) {
    if (mozmill.isLinux) {
      // Clicking on the close button, but it has the effect of recording the
      // configuration, not discarding all the inputs entered.
      controller.click(new elementslib.Lookup(controller.window.document,
        '/id("fidesfit-config-dialog")/anon({"anonid":"dlg-buttons"})/{"dlgtype":"cancel"}'));
    } else if (mozmill.isWindows) {
      controller.click(new elementslib.Lookup(controller.window.document,
        '/id("fidesfit-config-dialog")/anon({"anonid":"dlg-buttons"})/{"dlgtype":"accept"}'));
    } else {
      // isMac
      controller.keypress(null, 'VK_ESCAPE', {});
    }
  },

  /**
   * Blanks a text input,
   * until Mozmill provides it natively cf. Bugzilla@Mozilla bug #568961
   */
  blankTextInput: function fidesfitHelper_blankTextInput(elem) {
    while (elem.getNode().value) {
      this._controller.keypress(elem, 'VK_BACK_SPACE', {});
    }
  },

  setModalDialogCbHandler: function fidesfitHelper_setModalDialogCbHandler(handler) {
    var md = new modal_dialog.modalDialog(handler);
    md.start();
  },

  openUrlInNewTab: function fidesfitHelper_openUrlInNewTab(url) {
    this._tabBrowser.openTab();
    this._controller.open(url);
  },

  // This method should be removed when bug 568978 lands on stable Mozmill
  arrayEquals: function fidesfitHelper_arrayEquals(value1, value2, comment) {
    if (value1.length != value2.length) {
      return false;
    }

    for (var i = 0; i < value1.length; i++) {
      if ((value1[i] !== value2[i]) || (typeof value1[i] != typeof value2[i])) {
        return false;
      }
    }
    return true;
  }

};

exports.FidesfitHelper = FidesfitHelper;
