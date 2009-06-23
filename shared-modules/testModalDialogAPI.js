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
 *   Clint Talbert <ctalbert@mozilla.com>
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

var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);

// Huge amounts of code here were leveraged from the password manager mochitest
// suite: http://mxr.mozilla.org/mozilla-central/source/toolkit/components/passwordmgr/test/prompt_common.js

const MODULE_NAME = 'ModalDialogAPI';

/**
 * Observer for modal dialog
 */
var mdObserver = {
  QueryInterface : function (iid) {
    const interfaces = [Ci.nsIObserver,
                        Ci.nsISupports,
                        Ci.nsISupportsWeakReference];

    if (!interfaces.some( function(v) { return iid.equals(v) } ))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  },

  observe : function (subject, topic, data) {
    if (this.docFinder()) {
      var window = mozmill.wm.getMostRecentWindow("");
      this.handler(new mozmill.controller.MozMillController(window));
    } else {
      // try again in a bit
      this.startTimer(this);
    }
  },

  handler: null,
  startTimer: null,
  docFinder: null
};

/**
 * Constructor for Modal Dialog
 *
 * @param aHandler function Callback function
 */
var modalDialog = function(aHandler) {
  this.observer = mdObserver;
  this.observer.handler = aHandler;
  this.observer.startTimer = this.start;
  this.observer.docFinder = this.getDialogDoc;
}

/**
 * Assign a new handler which will be called when the modal dialog has been opened
 *
 * @param aHandler function Callback function
 */
modalDialog.prototype.setHandler = function md_sethndlr(aHandler) {
  this.observer.handler = aHandler;
}

/**
 * Start timer to wait for modal dialog
 *
 * @param aObserver object Observer
 */
modalDialog.prototype.start = function md_start(aObserver) {
  const dialogDelay = 100;
  var modalDialogTimer = Cc["@mozilla.org/timer;1"].
                         createInstance(Ci.nsITimer);

  // If we are not called from the observer, we have to use the supplied
  // observer instead of this.observer
  if (aObserver) {
    modalDialogTimer.init(aObserver,
                          dialogDelay,
                          Ci.nsITimer.TYPE_ONE_SHOT);
  } else {
    modalDialogTimer.init(this.observer,
                          dialogDelay,
                          Ci.nsITimer.TYPE_ONE_SHOT);
  }
}

/**
 * Get document of wanted modal dialog
 *
 * @returns bool Returns true if modal dialog has been found
 */
modalDialog.prototype.getDialogDoc = function md_getDD() {
  var enumerator = mozmill.wm.getXULWindowEnumerator("");

  // Find the <browser> which contains notifyWindow, by looking
  // through all the open windows and all the <browsers> in each.
  while (enumerator.hasMoreElements()) {
    var win = enumerator.getNext();
    var windowDocShell = win.QueryInterface(Components.interfaces.nsIXULWindow).docShell;

    var containedDocShells = windowDocShell.getDocShellEnumerator(
                                      Components.interfaces.nsIDocShellTreeItem.typeChrome,
                                      Components.interfaces.nsIDocShell.ENUMERATE_FORWARDS);

    while (containedDocShells.hasMoreElements()) {
      // Get the corresponding document for this docshell
      var childDocShell = containedDocShells.getNext();

      // We don't want it if it's not done loading.
      if (childDocShell.busyFlags != Components.interfaces.nsIDocShell.BUSY_FLAGS_NONE)
        continue;

      // Ensure that we are only returning the dialog if it is indeed the modal
      // dialog we were looking for.
      if (win.chromeFlags | Ci.nsIWebBrowserChrome.CHROME_MODAL &&
          win.chromeFlags | Ci.nsIWebBrowserChrome.CHROME_DEPENDENT) {
        return true;
      }
    }
  }

  return false;
}
