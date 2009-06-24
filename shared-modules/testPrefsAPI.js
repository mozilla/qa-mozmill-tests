/* * ***** BEGIN LICENSE BLOCK *****
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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Clint Talbert <ctalbert@mozilla.com>
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
 * **** END LICENSE BLOCK ***** */

var MODULE_NAME = 'PrefsAPI';

const RELATIVE_ROOT = '.'
const MODULE_REQUIRES = ['ModalDialogAPI'];

/**
 * Preferences Function for access to the dialog
 *
 * @param callback handler The callback handler to use to interact with the preference dialog
 * @param callback launcher An optional callback to be used for launching the preference dialog
 */
function handlePreferencesDialog(handler, launcher) {
  if(!handler)
    throw "No handler given for Preferences Dialog";

  if (mozmill.isWindows) {
    // Pref dialog is modal on windows, set up our handler
    var md = collector.getModule('ModalDialogAPI');
    var prefModal = new md.modalDialog(handler);
    prefModal.start();
  }

  // Launch the dialog
  var prefCtrl = null;
  if (launcher) {
    launcher();

    // Now that we've launched the dialog, wait a bit for the window
    mozmill.controller.sleep(500);
    var win = Cc["@mozilla.org/appshell/window-mediator;1"]
                 .getService(Ci.nsIWindowMediator).getMostRecentWindow(null);
    prefCtrl = new mozmill.controller.MozMillController(win);
  } else {
    prefCtrl = new mozmill.getPreferencesController();
  }

  // If the dialog is not modal, run the callback directly
  if (!mozmill.isWindows) {
    prefCtrl.sleep(500);
    handler(prefCtrl);
  }

  // Wait a bit to make sure window has been closed
  mozmill.controller.sleep(500);
}

/**
 * Preferences helper object for accessing nsIPrefBranch.
 *
 * @class Preferences
 */
var preferences = {
  _branch : Cc["@mozilla.org/preferences-service;1"].
            getService(Ci.nsIPrefBranch),

  /**
   *  Use branch to access low level functions of nsIPrefBranch
   */
  get branch() {
    return this._branch;
  },

  /**
   * Called to get the state of an individual preference.
   *
   * @param aPrefName     string The preference to get the state of.
   * @param aDefaultValue any    The default value if preference was not found.
   *
   * @returns any The value of the requested preference
   *
   * @see setPref
   */
  getPref : function p_getPref(aPrefName, aDefaultValue) {
    try {
      switch (typeof aDefaultValue) {
        case ('boolean'):
          return this._branch.getBoolPref(aPrefName);
        case ('string'):
          return this._branch.getCharPref(aPrefName);
        case ('number'):
          return this._branch.getIntPref(aPrefName);
        default:
          return undefined;
      }
    } catch(e) {
      return aDefaultValue;
    }
  },

  /**
   * Called to set the state of an individual preference.
   *
   * @param aPrefName string The preference to set the state of.
   * @param aValue    any    The value to set the preference to.
   *
   * @returns boolean Returns true if value was successfully set.
   *
   * @see getPref
   */
  setPref : function p_setPref(aName, aValue) {
    try {
      switch (typeof aValue) {
        case ('boolean'):
          this._branch.setBoolPref(aName, aValue);
          break;
        case ('string'):
          this._branch.setCharPref(aName, aValue);
          break;
        case ('number'):
          this._branch.setIntPref(aName, aValue);
          break;
        default:
          return false;
      }
    } catch(e) {
      return false;
    }

    return true;
  }
};
