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
 * Namespace
 */
var fidesfit = (typeof fidesfit == 'undefined') ? {}: fidesfit;

Cu.import('resource://fidesfit-modules/log4moz.jsm', fidesfit);

// The module that will be monkey-patched
Cu.import('resource://fidesfit-modules/net.jsm', fidesfit);

const HTTP_URLS = ['http://www.google.com/',
                   'http://maps.google.com/',
                   'http://news.google.com/',
                   'http://example.net/',
                   'http://ec.europa.eu/atwork/index_fr.htm'
                  ];
const HTTPS_URLS = ['https://www.lcl.fr/',
                    'https://particuliers.societegenerale.fr/'
                   ];

// Storing the original methods to later-on be able to restore them
const ORIGINAL_NET_GETANDREACT = fidesfit.net.getAndReact;
const ORIGINAL_NET_POSTANDREACT = fidesfit.net.postAndReact;

/**
 * Mozmill controller of the browser window to operate on
 */
var controller;
var config;
var calls_count;
var suggestion_urls;
var suggested_urls_count;

/**
 * The net mockup
 */
var mockup = {

  /**
   * Sets up (activates) the net mockup this will respond to the extension as a
   * true Fidesfit server would in a predictable way for test purpose.
   *
   * @param {Object} conf the configuration with the following properties:
   *   - server_on_error simulates an unresponding server (false by default)
   *   - https_suggestions returns HTTPS URLs for suggestions,
   *     returns HTTP URLs otherwise (false by default)
   *   - controller the MozMillController
   */
  setup: function(conf) {
    config = conf;
    controller = config.controller;

    calls_count = 0;
    suggested_urls_count = 0;

    if (config.https_suggestions)
      suggestion_urls = HTTPS_URLS;
    else
      suggestion_urls = HTTP_URLS;

    // Actual net module monkey-patching
    fidesfit.net.getAndReact = this._reactMockup;
    fidesfit.net.postAndReact = this._reactMockup;
  },

  /**
   * Tears down the mockup, with the concrete result of restoring the net
   * module back to its original state.
   */
  teardown: function() {
    // Monkey-patching the net module back to its original state
    fidesfit.net.getAndReact = ORIGINAL_NET_GETANDREACT;
    fidesfit.net.postAndReact = ORIGINAL_NET_POSTANDREACT;
  },

  _reactMockup: function(params, method_path, success_callback,
                         success_callback_params, error_callback) {
    calls_count++;

    var params_str = fidesfit.net.stringifyParams(params);
    var message = "net.mockup._reactMockup (config: " + config + ") " +
      "request for " + method_path + " :\n" +
      "params:\n" + params_str;
    this._logger.debug(message);

    // Code to emulate a server on error
    if (config.server_on_error) {
      throw new fidesfit.NetException("net.mockup on error on purpose",
                                      503, method_path);
    }

    var response;
    switch (method_path) {

    case '/suggestion/uri':
      if (suggested_urls_count >= suggestion_urls.length) {
        controller.window.alert("net.mockup ERROR: no more URLs");
      }

      var uri = suggestion_urls[suggested_urls_count];
      response = JSON.stringify({ uri: uri });

      suggested_urls_count++;
      break;

    case '/score/liking':
      // Always returns the same score
      response = JSON.stringify({ score: 77, uri: params['uris[0]'] });
      break;

    case '/user_messages/fetch':
      // Always returns one user message
      var user_message = {
        message_type: 'use_suggestions',
        path: '/user_messages/lack_opinions'
      };
      response = JSON.stringify([ user_message ]);
      break;

    default:
      controller.window.alert(
        "net.mockup ERROR: Unimplemented method_path: " + method_path);

    }

    this._logger.debug("net.mockup._reactMockup response for method_path: " +
        method_path + " :\n" + response);

    if (success_callback)
      success_callback(response, params, success_callback_params);

    return response;
  },

  /**
   * Returns the number of calls made to the mockup since its setup.
   */
  get calls_count() {
    return calls_count;
  },

  // *************************************************************************

  _logger: fidesfit.Log4Moz.repository.getLogger('fidesfit.mozmill.net.mockup')


};

exports.mockup = mockup;
