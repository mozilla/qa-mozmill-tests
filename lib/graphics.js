/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var frame = {};
Cu.import('resource://mozmill/modules/frame.js', frame);


Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");


XPCOMUtils.defineLazyGetter(this, "gfxInfo", function () {
  try {
    return Cc["@mozilla.org/gfx/info;1"]
           .getService(Ci.nsIGfxInfo);
  }
  catch (e) {
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

        var version = Services.sysinfo.getProperty("version");
        var isWindowsVistaOrHigher = (parseFloat(version) >= 6.0);
        if (isWindowsVistaOrHigher) {
          var d2dEnabled = "false";
          try {
            d2dEnabled = gfxInfo.D2DEnabled;
          }
          catch(e) {}
          this._pushFeatureInfo("direct2DEnabled", gfxInfo.FEATURE_DIRECT2D, d2dEnabled);

          var dwEnabled = "false";
          try {
            dwEnabled = gfxInfo.DWriteEnabled + " (" + gfxInfo.DWriteVersion + ")";
          }
          catch(e) {}
          this._pushInfo("directWriteEnabled", dwEnabled);

          var cleartypeParams = "";
          try {
            cleartypeParams = gfxInfo.cleartypeParameters;
          }
          catch(e) {
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
      }
      catch (e) {
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
      }
      else {
        var webglfeature = gfxInfo.FEATURE_WEBGL_OPENGL;
      }
      this._pushFeatureInfo("webglRenderer", webglfeature, webglenabled, webglrenderer);

      // display any failures that have occurred
      var failureCount = {};
      var failureIndices = {};
      this._failures = gfxInfo.getFailures(failureCount, failureIndices);
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
    }
    else {
      if (mozmill.isWindows) {
        var feature = gfxInfo.FEATURE_DIRECT3D_9_LAYERS;
      }
      else {
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
  _errorMessageForFeature : function Graphics_errorMessageForFeature(aFeature) {
    var errorMessage;
    var status;
    try {
      status = gfxInfo.getFeatureStatus(aFeature);
    }
    catch(e) {}
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
          suggestedDriverVersion = gfxInfo.getFeatureSuggestedDriverVersion(aFeature);
        }
        catch(e) {}
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
  _pushInfo : function Graphics_pushInfo(aName, aValue) {
    // Push all information, even if it has no value
    this._info.push({"label": this._bundle.GetStringFromName(aName),
                     "value": aValue});
  },

  /**
   * Push graphics feature info
   */
  _pushFeatureInfo : function Graphics_pushFeatureInfo(aName, aFeature, aIsEnabled, aMessage) {
    aMessage = aMessage || aIsEnabled;
    if (!aIsEnabled) {
      var errorMessage = this._errorMessageForFeature(aFeature);
      if (errorMessage)
        aMessage = errorMessage;
    }
    this._pushInfo(aName, aMessage);
  }
}


function hexValueToString(aValue) {
  return aValue
         ? String('0000' + aValue.toString(16)).slice(-4)
         : null;
}


/**
 * Retrieve information from installed add-ons and send it to Mozmill
 */
function submitGraphicsInformation() {
  var graphics = new Graphics();
  frame.events.fireEvent('graphics', graphics.gather());
}


// Export of classes
exports.Graphics = Graphics;

// Export of functions
exports.submitGraphicsInformation = submitGraphicsInformation;
