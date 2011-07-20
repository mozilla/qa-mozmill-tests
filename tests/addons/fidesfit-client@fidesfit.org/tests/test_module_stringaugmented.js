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
 * Unit testing the StringAugmented.jsm module.
 */

Cu.import('resource://mozmill/modules/jum.js');
Cu.import('resource://fidesfit-modules/StringAugmented.jsm');

var fidesfit_helper_module = require('../lib/fidesfit_helper');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  fidesfit_helper = new fidesfit_helper_module.FidesfitHelper(controller);
  //fidesfit.config.enableAllLogging();
};

var testStringAugmented = function() {
  var str1 = new StringAugmented("Use this");
  assertTrue(str1.startsWith("Use"));
  assertFalse(str1.startsWith("Don't"));
  assertTrue(str1.endsWith("this"));
  assertFalse(str1.endsWith("that"));

  // Using the method on the created object
  assertTrue(new StringAugmented("Use this").startsWith("Use"));

  var str21 = new StringAugmented("%s");
  assertEquals("monkeys", str21.format("monkeys"));

  var str22 = new StringAugmented("Some %s replacements in a text");
  assertEquals("Some monkeys replacements in a text", str22.format("monkeys"));

  // TODO: Fix this test that doesn't pass
  //var str23 = new StringAugmented("%s %s");
  //assertEquals("angry monkeys", str23.format("angry", "monkeys"));

  var str3 = new StringAugmented("%(key)s: %(value)s");
  assertEquals("bananas: tasty", str3.format({key: 'bananas', value: 'tasty'}));

  // Using the method on the created object
  assertEquals("bananas: tasty",
    new StringAugmented("%(key)s: %(value)s").format({key: 'bananas', value: 'tasty'}));

  var str4 = new StringAugmented("%i - %i");
  assertEquals("1 - 3", str4.format([1, 3]));

  var str5 = new StringAugmented("%r");
  assertEquals('["a", "b"]', str5.format(['a', 'b']));
};

// TODO: Make this work
// var testInheritedMethods = function() {

//   var str1 = new StringAugmented("Use this");
//   str1.replace('Use', 'Try');
//   assertEquals("Try this", str1);

//   var str2 = new StringAugmented("Use this");
//   var res = str2.slice(0, -2);
//   assertEquals("Use th", res);

// };
