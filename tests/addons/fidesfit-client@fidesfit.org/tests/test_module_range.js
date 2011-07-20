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
 * Unit testing the Range.jsm module.
 */

Cu.import('resource://mozmill/modules/jum.js');
Cu.import('resource://fidesfit-modules/Range.jsm');
Cu.import('resource://fidesfit-modules/ranges.jsm');

var fidesfit_helper_module = require('../lib/fidesfit_helper');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  fidesfit_helper = new fidesfit_helper_module.FidesfitHelper(controller);
};

var testInclude = function() {

//  [-100, -50, -49.6].forEach(
  [0, 25, 25.4].forEach(
    function (value) {
      assertTrue(RANGE1.include(value), value + " not in RANGE1");
    }
  );

//  [-49.5, -49, 0, 0.4].forEach(
  [25.6, 26, 50, 50.33333].forEach(
    function (value) {
      assertTrue(RANGE2.include(value), value + " not in RANGE2");
    }
  );

//  [0.5, 1, 50, 50.2, 50.20, 50.24].forEach(
  [50.8, 51, 51.9, 75, 75.3].forEach(
    function (value) {
      assertTrue(RANGE3.include(value), value + " not in RANGE3");
    }
  );

//  [50.8, 50.80, 50.84, 51, 100].forEach(
  [75.6, 76, 76.80, 91, 100].forEach(
    function (value) {
      assertTrue(RANGE4.include(value), value + " not in RANGE4");
    }
  );

};

var testIterator = function() {
  var range = new Range(3, 5);
  var res = new Array();
  for (var i in range)
    res.push(i);

  assert(fidesfit_helper.arrayEquals([3, 4, 5], res));
};
