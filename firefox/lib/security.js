/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../lib/assertions");

const SSLSTATUS_TIMEOUT = 10000;

/**
 * Get the certificate of the associated controller
 *
 * @params {object} aSecurityUI
 *         The security UI for which to get the certificate
 *
 * @returns {object} Certificate of the current browsing page, or null if no
 *                   certificate exists
 */
function getCertificate(aSecurityUI) {
  assert.ok(aSecurityUI instanceof Ci.nsISSLStatusProvider,
            "aSecurityUI has been passed of correct type");

  var SSLStatus = aSecurityUI.QueryInterface(Ci.nsISSLStatusProvider).SSLStatus;
  assert.waitFor(() => !!SSLStatus,
                 "SSLStatus is ready", SSLSTATUS_TIMEOUT);

  return SSLStatus.serverCert;
}

/**
 * Get a property of a certificate
 *
 * @param {Object} aCert
 *        The certificate for which we get the property
 * @param {string} aLocation
 *        Poperty of the certificate needed
 * @param {string} [aLocationProp]
 *        Browser location property
 *
 * @returns {string} A string representing properties value
 */
function getCertificateProperty(aCert, aLocation, aLocationProp) {
  switch (aLocation) {
    case "city" :
      return aCert.subjectName.substring(aCert.subjectName.indexOf("L=") + 2,
                                         aCert.subjectName.indexOf(",ST="));

    case "country" :
      return aCert.subjectName.substring(aCert.subjectName.indexOf("C=") + 2,
                                         aCert.subjectName.indexOf(",postalCode="));

    case "location":
      var state = getCertificateProperty(aCert, "state");
      var country = getCertificateProperty(aCert, "country");
      var updateLocationLabel = aLocationProp.replace("%S", state).replace("%S", country);

      return getCertificateProperty(aCert, "city") + '\n' + updateLocationLabel;

    case "state" :
      return aCert.subjectName.substring(aCert.subjectName.indexOf("ST=") + 3,
                                         aCert.subjectName.indexOf(",C="));

    default :
      assert.fail("Unknown property given - " + aLocation);
  }
}

// Export of functions
exports.getCertificate = getCertificate;
exports.getCertificateProperty = getCertificateProperty;
