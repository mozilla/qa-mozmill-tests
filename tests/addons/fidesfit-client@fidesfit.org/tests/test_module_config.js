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
 * Unit testing the config.jsm module.
 */

Cu.import('resource://mozmill/modules/jum.js');
Cu.import('resource://fidesfit-modules/config.jsm');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
};

var testConfigModule = function () {
  assertNotUndefined(config.extension_id);
  assertNotNull(config.extension_id);

  assertNotUndefined(config.pref_branch_name);
  assertNotNull(config.pref_branch_name);

  var initial_value = config.get('cache.success.ttl');
  var new_value = 888;
  assert(initial_value !== new_value);

  config.set('cache.success.ttl', new_value);
  assertEquals(new_value, config.get('cache.success.ttl'));

  // Setting back to initial value
  config.set('cache.success.ttl', initial_value);
};
