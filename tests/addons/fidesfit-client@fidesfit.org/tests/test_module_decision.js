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
 * Unit testing the decision.jsm module which is about deciding whether an URL
 * should be processed considered the user preferences regarding schemes,
 * blacklist, whitelist, etc. (some of them stored in the SQLite database).
 */

Cu.import('resource://mozmill/modules/jum.js');
Cu.import('resource://fidesfit-modules/config.jsm');
Cu.import('resource://fidesfit-modules/debug.jsm');
Cu.import('resource://fidesfit-modules/decision.jsm');

var fidesfit_helper_module = require('../lib/fidesfit_helper');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  fidesfit_helper = new fidesfit_helper_module.FidesfitHelper(controller);
};

var testSchemes = function() {
  var considered_schemes = decision.considered_schemes;
  assert(considered_schemes.length > 0);

  var url1 = 'ftp://example.com/';
  var url2 = 'http://fidesfit.org/';
  var url3 = 'https://fidesfit.org/';
  var url4 = 'view-source:http://www.example.com/';
  assertFalse(decision.hasConsideredScheme(url1));
  assertTrue(decision.hasConsideredScheme(url2));
  assertFalse(decision.hasConsideredScheme(url3));
  assertFalse(decision.hasConsideredScheme(url4));

  var filtered_urls = decision.
    filterOnConsideredSchemes([url1, url2, url3, url4]);
  assert(fidesfit_helper.arrayEquals([url2], filtered_urls));
};

var testBlacklistUniqueness = function() {
  //fidesfit.config.enableAllLogging();

  decision.blacklistHost('http://www.edreams.fr/');
  controller.sleep(500);
  var count = decision.getRecordCount();
  assertEquals('number', typeof(count));
  assert(count > 0);

  decision.blacklistHost('http://www.edreams.fr/');
  var new_count = decision.getRecordCount();
  assertEquals('number', typeof(new_count));
  assert(new_count > 0);
  assertEquals(count, new_count);
};

var testBlacklistHost = function() {
  //fidesfit.config.enableAllLogging();

  decision.blacklistHost('http://www.lcl.fr/');
  controller.sleep(500);

  var reasons;

  reasons = decision.isBlocking('http://www.lcl.fr/');
  assertEquals(1, reasons.length, "bad size");
  assertEquals('host', reasons[0], "bad reason");

  reasons = decision.isBlocking('http://www.lcl.fr/info?help=firefox');
  assertEquals(1, reasons.length, "bad size: " + reasons.length + " instead of 1");
  assertEquals('host', reasons[0], "bad reason");

  reasons = decision.isBlocking('http://www2.lcl.fr/');
  assertEquals(false, reasons);

  reasons = decision.isBlocking('http://lcl.fr/');
  assertEquals(false, reasons);

  reasons = decision.isBlocking('http://example.net/');
  assertEquals(false, reasons);
};

var testBlacklistDomain = function() {
  //fidesfit.config.enableAllLogging();

  // This blacklists the domain of the following URL, ie youtube.com
  decision.blacklistDomain('http://www.youtube.com/');
  controller.sleep(500);

  var reasons;

  reasons = decision.isBlocking('http://www.youtube.com/t/privacy_at_youtube');
  assertEquals(1, reasons.length, "bad size");
  assertEquals('domain', reasons[0], "bad reason");

  reasons = decision.isBlocking('http://youtube.com/');
  assertEquals(1, reasons.length, "bad size");
  assertEquals('domain', reasons[0], "bad reason");

  reasons = decision.isBlocking('http://example.net/');
  assertEquals(false, reasons);
};
