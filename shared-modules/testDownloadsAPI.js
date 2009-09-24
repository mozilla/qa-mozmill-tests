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
 * The DownloadAPI adds support for download related functions. It gives access
 * to the Download Manager
 *
 * @version 1.0.1
 */

var MODULE_NAME = 'DownloadsAPI';

const gTimeout = 5000;

/**
 * Constructor
 */
function downloadManager()
{
}

/**
 * Download Manager class
 */
downloadManager.prototype = {

  /**
   * Open the Download Manager
   *
   * @param {MozMillController} controller
   *        MozMillController of the window to operate on
   * @param {boolean} shortcut
   *        If true the keyboard shortcut is used
   */
  open : function downloadmanager_open(controller, shortcut)
  {
    if (shortcut) {
      // XXX: Cannot extract commandKeys from DTD until bug 504635 is fixed
      if (mozmill.isLinux)
        controller.keypress(null, "y", {ctrlKey: true, shiftKey: true});
      else
        controller.keypress(null, "j", {accelKey: true});
    } else {
      controller.click(new elementslib.Elem(controller.menus["tools-menu"].menu_openDownloads));
    }

    // Wait until the window has been opened
    controller.sleep(500);
    controller.waitForEval("subject.getMostRecentWindow('Download:Manager') != null",
                           gTimeout, 100, mozmill.wm);

    var window = mozmill.wm.getMostRecentWindow('Download:Manager');
    this._controller = new mozmill.controller.MozMillController(window);

    return this._controller;
  },

  /**
   * Close the download manager
   */
  close : function downloadmanager_close()
  {
    var windowCount = mozmill.utils.getWindows().length;

    this._controller.keypress(null, 'w', {accelKey: true});
    this._controller.waitForEval("subject.getWindows().length == " + (windowCount - 1),
                         gTimeout, 100, mozmill.utils);
  }
};
