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
 * Portions created by the Initial Developer are Copyright (C) 2011
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
 * Unit testing the OrderedMap.jsm module.
 */

Cu.import('resource://mozmill/modules/jum.js');
Cu.import('resource://fidesfit-modules/OrderedMap.jsm');

var fidesfit_helper_module = require('../lib/fidesfit_helper');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  fidesfit_helper = new fidesfit_helper_module.FidesfitHelper(controller);
};

var testOperations = function() {
  var ordered_map = new OrderedMap();
  ordered_map.set('abcdefg', 'Some value');
  ordered_map.set('Z', 42);
  ordered_map.set(1984, 'No');
  assertEquals(3, ordered_map.length);
  assert(fidesfit_helper.arrayEquals(
    ['abcdefg', 'Z', 1984], ordered_map.keys));
};

var testImmutableKeys = function() {
  var ordered_map = new OrderedMap();
  ordered_map.set('abcdefg', 'Some value');
  ordered_map.set('http://example.net', 42);
  ordered_map.set('Zoo', 'Another value');
  ordered_map.keys.push('NOT ME');
  assert(fidesfit_helper.arrayEquals(
    ['abcdefg', 'http://example.net', 'Zoo'], ordered_map.keys));
};

var testMaxItems = function() {
  var ordered_map = new OrderedMap({ max_items: 2 });
  ordered_map.set('abcdefg', 'Some value');
  ordered_map.set('http://example.net', 42);
  ordered_map.set('Zoo', 'Another value');
  assertEquals(2, ordered_map.length);
  assert(fidesfit_helper.arrayEquals(
    ['Zoo', 'http://example.net'], ordered_map.keys));
};

var testChangeOrder = function() {
  var ordered_map1 = new OrderedMap();
  ordered_map1.set('abcdefg', 'Some value');
  ordered_map1.set('http://example.net', 42);
  ordered_map1.set('Zoo', 'Another value');
  ordered_map1.set('http://example.net', 'NEW value');
  assertEquals('NEW value', ordered_map1.get('http://example.net'));
  assert(fidesfit_helper.arrayEquals(
    ['abcdefg', 'http://example.net', 'Zoo'], ordered_map1.keys));

  var ordered_map2 = new OrderedMap({ change_order: true });
  ordered_map2.set('abcdefg', 'Some value');
  ordered_map2.set('http://example.net', 42);
  ordered_map2.set('Zoo', 'Another value');
  ordered_map2.set('http://example.net', 'NEW value');
  assertEquals('NEW value', ordered_map2.get('http://example.net'));
  assert(fidesfit_helper.arrayEquals(
    ['abcdefg', 'Zoo', 'http://example.net'], ordered_map2.keys));
};

var testNewFromJson = function() {
  var ordered_map = new OrderedMap();
  ordered_map.set('abcdefg', 'Some value');
  ordered_map.set('Z', 42);
  ordered_map.set(1984, 'No');
  var data = JSON.stringify(ordered_map);
  var ordered_map_unserialized = OrderedMap.newFromJson(data);

  assertEquals(ordered_map._max_items, ordered_map_unserialized._max_items);
  assertEquals(ordered_map._change_order,
    ordered_map_unserialized._change_order);

  assert(fidesfit_helper.arrayEquals(
    ordered_map.keys, ordered_map_unserialized.keys));
  assert(fidesfit_helper.arrayEquals(
    ['abcdefg', 'Z', 1984], ordered_map_unserialized.keys));

  assertEquals('Some value', ordered_map.get('abcdefg'));
  assertEquals(42, ordered_map.get('Z'));
  assertEquals('No', ordered_map.get(1984));
};
