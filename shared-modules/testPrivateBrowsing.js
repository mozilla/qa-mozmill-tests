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
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is Henrik Skupin
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
 * **** END LICENSE BLOCK ***** */

const MODULE_NAME = 'PrivateBrowsingAPI';

const RELATIVE_ROOT = '.';
const MODULE_REQUIRES = ['ModalDialogAPI', 'PrefsAPI'];

// Preference for confirmation dialog when entering Private Browsing mode
const PB_NO_PROMPT_PREF = 'browser.privatebrowsing.dont_prompt_on_enter';

/**
 * Constructor for privateBrowsing class
 *
 * @param controller object Controller of the browser window
 */
function privateBrowsing(controller) {
  this._prefs = collector.getModule('PrefsAPI').preferences;

  this._controller = controller;
  this._pbMenuItem = new elementslib.Elem(this._controller.menus['tools-menu'].privateBrowsingItem);

  this.__defineGetter__('_pbs', function() {
    delete this._pbs;
    return this._pbs = Cc["@mozilla.org/privatebrowsing;1"].
                       getService(Ci.nsIPrivateBrowsingService);
  });
}

/**
 * privateBrowsing class
 */
privateBrowsing.prototype = {
  _handler: null,

  /**
   *  Start Private Browsing mode
   *
   *  @param useMenu boolean Use menu entry if true otherwise the keyboard shortcut
   */
  start: function pbstart(useMenu) {
    if (this.enabled)
      return;

    if (this.showPrompt) {
      // Check if handler is set to prevent a hang
      if (!this._handler)
        throw "Private Browsing mode not enabled due to missing handler";

      var md = collector.getModule('ModalDialogAPI');
      dialog = new md.modalDialog(this._handler);
      dialog.start();
    }

    if (useMenu) {
      this._controller.click(this._pbMenuItem);
    } else {
      this._controller.keypress(null, 'p', {accelKey: true, shiftKey: true});
    }

    // We have to wait a bit until the transition happened
    this._controller.sleep(200);
  },

  /**
   * Stop Private Browsing mode
   *
   *  @param useMenu boolean Use menu entry if true otherwise the keyboard shortcut
   */
  stop: function pbstop(useMenu) {
    if (!this.enabled)
      return;

    if (useMenu) {
      this._controller.click(this._pbMenuItem);
    } else {
      this._controller.keypress(null, 'p', {accelKey: true, shiftKey: true});
    }

    // We have to wait a bit until the transition happened
    this._controller.sleep(200);
  }
}

privateBrowsing.prototype.__defineGetter__('enabled', function() {
  return this._pbs.privateBrowsingEnabled;
});

privateBrowsing.prototype.__defineSetter__('enabled', function(v) {
  this._pbs.privateBrowsingEnabled = v;
});

privateBrowsing.prototype.__defineSetter__('handler', function(v) {
  this._handler = v;
});

privateBrowsing.prototype.__defineGetter__('showPrompt', function() {
  return !this._prefs.getPref(PB_NO_PROMPT_PREF, true);
});

privateBrowsing.prototype.__defineSetter__('showPrompt', function(v) {
  this._prefs.setPref(PB_NO_PROMPT_PREF, !v);
});
