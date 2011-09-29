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
 * The Original Code is Mozmill Test code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Dave Hunt <dhunt@mozilla.com>
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

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
 
 
XPCOMUtils.defineLazyGetter(this, "gfxInfo", function () {
  try { 
    return Cc["@mozilla.org/gfx/info;1"].
           getService(Ci.nsIGfxInfo);
  } catch (e) {
    return null;
  }
});


/**
 * Constructor
 *
 * @constructor
 */
function Graphics() {
  this._bundle = Services.strings.createBundle("chrome://global/locale/aboutSupport.properties");
}

/**
 * Graphics class
 * 
 * Much of this code is taken from Firefox's about:support code.
 * @see http://mxr.mozilla.org/mozilla-central/source/toolkit/content/aboutSupport.js
 */
Graphics.prototype = {

  /**
   * Gather graphics info and failures
   */
  gather : function Graphics_gather() {
    this._info = [];
    this._failures = [];
  
    if (gfxInfo) {
      this._pushInfo("adapterDescription", gfxInfo.adapterDescription);
      this._pushInfo("adapterVendorID", hexValueToString(gfxInfo.adapterVendorID));
      this._pushInfo("adapterDeviceID", hexValueToString(gfxInfo.adapterDeviceID));
      this._pushInfo("adapterRAM", gfxInfo.adapterRAM);
      this._pushInfo("adapterDrivers", gfxInfo.adapterDriver);
      this._pushInfo("driverVersion", gfxInfo.adapterDriverVersion);
      this._pushInfo("driverDate", gfxInfo.adapterDriverDate);

      if (mozmill.isWindows) {
        this._pushInfo("adapterDescription2", gfxInfo.adapterDescription2);
        this._pushInfo("adapterVendorID2", hexValueToString(gfxInfo.adapterVendorID2));
        this._pushInfo("adapterDeviceID2", hexValueToString(gfxInfo.adapterDeviceID2));
        this._pushInfo("adapterRAM2", gfxInfo.adapterRAM2);
        this._pushInfo("adapterDrivers2", gfxInfo.adapterDriver2);
        this._pushInfo("driverVersion2", gfxInfo.adapterDriverVersion2);
        this._pushInfo("driverDate2", gfxInfo.adapterDriverDate2);
        this._pushInfo("isGPU2Active", gfxInfo.isGPU2Active);
    
        var version = Cc["@mozilla.org/system-info;1"]
                      .getService(Ci.nsIPropertyBag2)
                      .getProperty("version");
        var isWindowsVistaOrHigher = (parseFloat(version) >= 6.0);
        if (isWindowsVistaOrHigher) {
          var d2dEnabled = "false";
          try {
            d2dEnabled = gfxInfo.D2DEnabled;
          } catch(e) {}
          this._pushFeatureInfo("direct2DEnabled", gfxInfo.FEATURE_DIRECT2D, d2dEnabled);
    
          var dwEnabled = "false";
          try {
            dwEnabled = gfxInfo.DWriteEnabled + " (" + gfxInfo.DWriteVersion + ")";
          } catch(e) {}
          this._pushInfo("directWriteEnabled", dwEnabled);  
    
          var cleartypeParams = "";
          try {
            cleartypeParams = gfxInfo.cleartypeParameters;
          } catch(e) {
            cleartypeParams = this._bundle.GetStringFromName("clearTypeParametersNotFound");
          }
          this._pushInfo("clearTypeParameters", cleartypeParams);  
        }
      }
  
      var webglrenderer;
      var webglenabled;
      try {
        webglrenderer = gfxInfo.getWebGLParameter("full-renderer");
        webglenabled = true;
      } catch (e) {
        webglrenderer = false;
        webglenabled = false;
      }
  
      if (mozmill.isWindows) {
        // If ANGLE is not available but OpenGL is, we want to report on the OpenGL feature, because that's what's going to get used.
        // In all other cases we want to report on the ANGLE feature.
        var webglfeature = gfxInfo.FEATURE_WEBGL_ANGLE;
        if (gfxInfo.getFeatureStatus(gfxInfo.FEATURE_WEBGL_ANGLE)  != gfxInfo.FEATURE_NO_INFO &&
            gfxInfo.getFeatureStatus(gfxInfo.FEATURE_WEBGL_OPENGL) == gfxInfo.FEATURE_NO_INFO)
          webglfeature = gfxInfo.FEATURE_WEBGL_OPENGL;
      } else {
        var webglfeature = gfxInfo.FEATURE_WEBGL_OPENGL;
      }
      this._pushFeatureInfo("webglRenderer", webglfeature, webglenabled, webglrenderer);
  
      // display any failures that have occurred
      this._failures = gfxInfo.getFailures();
    } // end if (gfxInfo)
  
    let windows = Services.ww.getWindowEnumerator();
    let acceleratedWindows = 0;
    let totalWindows = 0;
    let mgrType;
    while (windows.hasMoreElements()) {
      totalWindows++;
  
      let awindow = windows.getNext().QueryInterface(Ci.nsIInterfaceRequestor);
      let windowutils = awindow.getInterface(Ci.nsIDOMWindowUtils);
      if (windowutils.layerManagerType != "Basic") {
        acceleratedWindows++;
        mgrType = windowutils.layerManagerType;
      }
    }
  
    let msg = acceleratedWindows + "/" + totalWindows;
    if (acceleratedWindows) {
      msg += " " + mgrType;
    } else {
      if (mozmill.isWindows) {
        var feature = gfxInfo.FEATURE_DIRECT3D_9_LAYERS;
      } else {
        var feature = gfxInfo.FEATURE_OPENGL_LAYERS;
      }
      var errMsg = this._errorMessageForFeature(feature);
      if (errMsg)
        msg += ". " + errMsg;
    }
  
    this._pushInfo("acceleratedWindows", msg);

    return {
      info : this._info,
      failures : this._failures};
  },

  /**
   * Get the error message for a particular feature
   */
  _errorMessageForFeature : function Graphics_errorMessageForFeature(feature) {
    var errorMessage;
    var status;
    try {
      status = gfxInfo.getFeatureStatus(feature);
    } catch(e) {}
    switch (status) {
      case gfxInfo.FEATURE_BLOCKED_DEVICE:
      case gfxInfo.FEATURE_DISCOURAGED:
        errorMessage = this._bundle.GetStringFromName("blockedGfxCard");
        break;
      case gfxInfo.FEATURE_BLOCKED_OS_VERSION:
        errorMessage = this._bundle.GetStringFromName("blockedOSVersion");
        break;
      case gfxInfo.FEATURE_BLOCKED_DRIVER_VERSION:
        var suggestedDriverVersion;
        try {
          suggestedDriverVersion = gfxInfo.getFeatureSuggestedDriverVersion(feature);
        } catch(e) {}
        if (suggestedDriverVersion)
          errorMessage = this._bundle.formatStringFromName("tryNewerDriver", [suggestedDriverVersion], 1);
        else
          errorMessage = this._bundle.GetStringFromName("blockedDriver");
        break;
    }
    return errorMessage;
  },

  /**
   * Push graphics info
   */
  _pushInfo : function Graphics_pushInfo(name, value) {
    // Push all information, even if it has no value
    this._info.push({"label": this._bundle.GetStringFromName(name),
                     "value": value});
  },

  /**
   * Push graphics feature info
   */
  _pushFeatureInfo : function Graphics_pushFeatureInfo(name, feature, isEnabled, message) {
    message = message || isEnabled;
    if (!isEnabled) {
      var errorMessage = this._errorMessageForFeature(feature);
      if (errorMessage)
        message = errorMessage;
    }
    this._pushInfo(name, message);
  },

}

function hexValueToString(value) {
  return value
         ? String('0000' + value.toString(16)).slice(-4)
         : null;
}

// Export of classes
exports.Graphics = Graphics;
