/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * This PrefsAPI provides access to the preferences system
 *
 * @version 1.0.0
 */

Cu.import("resource://gre/modules/Services.jsm");

/**
 * Use prefBranch to access low level functions of nsIPrefBranch
 *
 * @return Instance of the preferences branch
 * @type nsIPrefBranch
 */
var prefBranch = Services.prefs.QueryInterface(Ci.nsIPrefBranch);

/**
 * Use defaultPrefBranch to access low level functions of the default branch
 *
 * @return Instance of the preferences branch
 * @type nsIPrefBranch
 */
var defaultPrefBranch = Services.prefs.getDefaultBranch("");

/**
 * Clear a user set preference
 *
 * @param {string} aPrefName
 *        The user-set preference to clear
 *
 * @return {boolean} False if the preference had the default value
 **/
function clearUserPref(aPrefName) {
  try {
    prefBranch.clearUserPref(aPrefName);
    return true;
  }
  catch (e) {
    return false;
  }
}

/**
 * Retrieve the value of an individual preference.
 *
 * @param {string} aPrefName
 *        The preference to get the value of.
 * @param {boolean/number/string} aDefaultValue
 *        The default value if preference cannot be found.
 * @param {boolean/number/string} aDefaultBranch
 *        If true the value will be read from the default branch (optional)
 * @param {string} aInterfaceType
 *        Interface to use for the complex value (optional)
 *        (nsILocalFile, nsISupportsString, nsIPrefLocalizedString)
 *
 * @return The value of the requested preference
 * @type boolean/int/string/complex
 */
function getPref(aPrefName, aDefaultValue, aDefaultBranch,
                                       aInterfaceType) {
  try {
    branch = aDefaultBranch ? defaultPrefBranch : prefBranch;

    // If interfaceType has been set, handle it differently
    if (aInterfaceType != undefined) {
      return branch.getComplexValue(aPrefName, aInterfaceType);
    }

    switch (typeof aDefaultValue) {
      case ('boolean'):
        return branch.getBoolPref(aPrefName);
      case ('string'):
        return branch.getCharPref(aPrefName);
      case ('number'):
        return branch.getIntPref(aPrefName);
      default:
        return undefined;
    }
  }
  catch(e) {
    return aDefaultValue;
  }
}

/**
 * Set the value of an individual preference.
 *
 * @param {string} aPrefName
 *        The preference to set the value of.
 * @param {boolean/number/string/complex} aValue
 *        The value to set the preference to.
 * @param {string} aInterfaceType
 *        Interface to use for the complex value
 *        (nsILocalFile, nsISupportsString, nsIPrefLocalizedString)
 *
 * @return {boolean} True if the value was successfully set.
 */
function setPref(aPrefName, aValue, aInterfaceType) {
  try {
    switch (typeof aValue) {
      case ('boolean'):
        this.prefBranch.setBoolPref(aPrefName, aValue);
        break;
      case ('string'):
        this.prefBranch.setCharPref(aPrefName, aValue);
        break;
      case ('number'):
        this.prefBranch.setIntPref(aPrefName, aValue);
        break;
      default:
        this.prefBranch.setComplexValue(aPrefName, aInterfaceType, aValue);
    }
  }
  catch(e) {
    return false;
  }

  return true;
}

// Export of variables
exports.prefBranch = prefBranch;
exports.defaultPrefBranch = defaultPrefBranch;

// Export object to access low level functions of nsIPrefService
exports.services = Services.prefs;

// Export of functions
exports.clearUserPref = clearUserPref;
exports.getPref = getPref;
exports.setPref = setPref;
