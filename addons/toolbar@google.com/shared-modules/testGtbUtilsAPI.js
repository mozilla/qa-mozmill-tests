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
 * @fileoverview This file contains utils function related to Google toolbar.
 * This is NOT a test file.
 * @author ankush@google.com (Ankush Kalkote)
 */
const MODULE_NAME = 'GtbUtilsAPI';

var jumlib = {};
Components.utils.import('resource://mozmill/modules/jum.js', jumlib);

const RLZ_REG_NAME = 'B3';
const REG_ADDRESS = 'Software\\Google\\Common\\Rlz\\RLZs';
const RLZ = 'rlz';

/**
 * Ids of Google toolbar elements.
 * @type string
 */
const GTB_ID = 'gtbToolbar';
const GTB_FIRST_RUN_IFRAME_ID = 'gtbFirstRunIFrame';
const GTB_FIRST_RUN_ACCEPT_BUTTON_ID = 'gtbFREnablePingsButton';

/**
 * Verifies that Google toolbar is installed and closes the first run dialog
 * if open.
 * @param {MozMillController} controller Mozmill controller of FF-window.
 */
function ensureGtbIsUsable(controller) {
  controller.window.focus();
  jumlib.assertNotNull(controller.window.document.getElementById(GTB_ID),
                       'Google toolbar is not installed.');

  first_run_iframe = controller.window.document.getElementById(
      GTB_FIRST_RUN_IFRAME_ID);
  if (first_run_iframe) {
    first_run_iframe.gtbFirstRun.complete();
  }
}

/**
 * Gives RLZ value for the toolbar.
 * For Windows RLZ value is located in the registry at -
 * HKEY_CURRENT_USER\Software\Google\Common\Rlz\RLZs .
 * For Linux and Mac it can found in firefox-googletoolbar.xml .
 * @return {string} RLZ parameter value.
 */
function getRlz() {
 if (mozmill.isWindows) {
    var winRegKey = Components.classes['@mozilla.org/windows-registry-key;1'].
                    createInstance(Components.interfaces.nsIWindowsRegKey);

    winRegKey.open(winRegKey.ROOT_KEY_CURRENT_USER, REG_ADDRESS,
                   winRegKey.ACCESS_READ);
    var rlzB3 = winRegKey.readStringValue(RLZ_REG_NAME);
    winRegKey.close();
    return rlzB3;
  } else if (mozmill.isLinux) {
    // RLZ value is stored in <home_dir>/.google/firefox-toolbar.xml.
    var gtbXmlFile = Components.classes['@mozilla.org/file/directory_service;1']
        .getService(Ci.nsIProperties).get('Home', Ci.nsILocalFile);
    gtbXmlFile.append('.google');
    gtbXmlFile.append('firefox-toolbar.xml');

    // open an input stream from file.
    var inputStream =
        Components.classes['@mozilla.org/network/file-input-stream;1'].
        createInstance(Components.interfaces.nsIFileInputStream);
    inputStream.init(gtbXmlFile, 0x01, 0444, 0); // Open in read-only mode.
    inputStream.QueryInterface(Components.interfaces.nsILineInputStream);

    var line = {}, hasMore;
    var fileText = '';
    do {
      hasMore = inputStream.readLine(line);
      fileText = fileText + line.value;
    } while (hasMore);
    inputStream.close();

    // TODO(ankush): Use parse from inputStream instead of string.
    var parser = Components.classes['@mozilla.org/xmlextras/domparser;1'].
                 createInstance(Components.interfaces.nsIDOMParser);

    // Create XML object from fileText and get rlz element.
    var doc = parser.parseFromString(fileText, 'text/xml');
    var rlzNode = doc.getElementsByTagName(RLZ);
    return rlzNode[0].firstChild.nodeValue;
  } else {
    // TODO(ankush): Implement it on Mac.
    throw ('Method not implemented for this platform');
  }
}

/**
 * This function enables/disables a toolbar feature by making direct calls to
 * toolbar functions instead of going through the options dialog. Use this for
 * for fast changing of state of a feature.
 * @param {MozMillController} controller Mozmill controller of FF-window.
 * @param {string} featureId Id of the feature to be changed. This is the same
 *                           as the lat part of the preference that saves the
 *                           state of the feature.
 * @param {boolean} enable If the feature should be enabled or disabled.
 */
function changeButtonEnableState(controller, featureId, enable) {
  var buttonChange = {};
  buttonChange[featureId] = enable;
  var gtbLayoutManager = controller.window.GTB_GoogleToolbarOverlay.appContext
                             .GTB_LayoutManager
  gtbLayoutManager.updateButtonsToPrefs(buttonChange);

  var prefSvc = Cc['@mozilla.org/preferences-service;1']
                  .getService(Ci.nsIPrefService);
  var prefs = prefSvc.getBranch('google.toolbar.button_option.');
  prefs.setBoolPref(featureId, enable);
}
