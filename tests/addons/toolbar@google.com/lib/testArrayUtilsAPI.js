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
 * The Original Code is Google toolbar mozmill test suite.
 *
 * The Initial Developer of the Original Code is Google.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Ankush Kalkote <ankush@google.com>
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
 * @fileoverview This file contains Array utils functions.
 * This is NOT a test file.
 *
 * @author ankush@google.com (Ankush Kalkote)
 */

// TODO(ankush): Add these methods to Array.prototype instead.
const MODULE_NAME = 'ArrayUtilsAPI';

/**
 * Checks if two arrays are equal or not.
 * @param {Array} array1 first array.
 * @param {Array} array2 second array.
 * @return {boolean} returns true if they are equal else returns false.
 */
function checkArraysEqual(array1, array2) {
   if (array1.length != array2.length) {
     return false;
   }
   for (var i = 0; i < array1.length; i++) {
     if ((array1[i] != array2[i]) || (typeof array1[i] != typeof array2[i])){
       return false;
     }
   }
   return true;
}

/**
 * Checks if the element is present in the array.
 * @param {Array} array Array in which element needs to be checked.
 * @param {Object} element the element to be checked if present in the Array.
 * @return {boolean} returns true if element is present in array.
 */
function checkArrayContains(array, element) {
  for (var j = 0; j < array.length; j++) {
    if (array[j] == element) {
      return true;
    }
  }
  return false;
}
