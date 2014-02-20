/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/FormHistory.jsm");

// Include required modules
var { assert, expect } = require("assertions");

/**
 * Create a new callback for the API calls
 * @constructor
 *
 * @param {Function} [aHandleResult]
 *        Function to trigger on the result we retrieve
 */
function Callback(aHandleResult) {
  this._resultHandle = aHandleResult || function() {};
  this.completed = false;
}

Callback.prototype = {
  /**
   * Change the state of the callback object if it completed successfully
   *
   * @param {Number} aReason=0|1
   *        The state of the callback once it finishes
   *        aReason is either 0 if successful or 1 if an error occurred.
   */
  handleCompletion: function Callback_handleCompletition(aReason) {
    if (aReason === 0) {
      this.completed = true;
    }
  },

  /**
   * Handle a failure if it occurs
   *
   * @param {String} aError
   *        Error that occurred
   */
  handleFailure: function Callback_handleFailure(aError) {
    expect.fail("Failed with: " + aError);
  },

  /**
   * Handle the result if present
   *
   * @param {Object} aResult
   *        The result returned within the callback function
   */
  handleResult: function Callback_handleResult(aResult) {
    this._resultHandle(aResult);
  }
}

/**
 * Add new entry to a specific field
 * All other proprietes of the entry will be initialized with the default values
 *
 * @params {String} aField
 *         Field for which we add the new entry
 * @params {String} aValue
 *         The value of the new entry to be added
 */
function add(aField, aValue) {
  assert.equal(typeof aField, "string", "Field is defined");
  assert.equal(typeof aValue, "string", "Value is defined");

  var spec = {
    op: "add",
    fieldname: aField,
    value: aValue
  };

  var callback = new Callback();
  FormHistory.update(spec, callback);

  assert.waitFor(() => callback.completed,
                 "Value '" + aValue + "' has been added for field '" + aField + "' ");
}

/**
 * Count entries in database that meets some filters
 * Returns total number of entries if no parameter is given
 *
 * @param {Object} [aSpec]
 *        Information  about the entries to be counted
 * @param {String} [aSpec.fieldname]
 *        Name of the field for which to count the entries
 * @param {String} [aSpec.value]
 *        Value of the entry
 * @param {Number} [aSpec.timesUsed]
 *        Times the value was used
 * @param {Date} [aSpec.firstUsed]
 *        The time the the entry was first created
 * @param {Date} [aSpec.lastUsed]
 *        The time the entry was last accessed
 * @param {String} [aSpec.guid]
 *        GUID of the value
 * @param {Date} [aSpec.firstUsedStart]
 *        Entries created after or at this time
 * @param {Datet} [aSpec.firstUsedEnd]
 *        Entries created before or at this time
 * @param {Date} [aSpec.lastUsedStart]
 *        Entries last accessed after or at this time
 * @param {Date} [aSpec.lastUsedEnd]
 *        Entries last accessed before or at this time
 *
 * @returns {Number} Number of results avaible
 */
function count(aSpec) {
  var spec = aSpec || {};
  var count = 0;

  var callback = new Callback(aResult => { count = aResult });
  FormHistory.count(spec, callback);

  assert.waitFor(() => callback.completed,
                 "Number of history form results retrieved");

  return count;
}

/**
 * Clear specific form data
 * Remove form entries that meets some filters
 * Remove all if the parameter is missing
 *
 * @param {Object} [aSpec]
 *        Information regarding the elements to be removed
 * @param {String} [aSpec.fieldname]
 *        Name of the field for which to remove the entries
 * @param {String} [aSpec.value]
 *        Value of the entry
 * @param {Number} [aSpec.timesUsed]
 *        Times the value was used
 * @param {Date} [aSpec.firstUsed]
 *        The time the the entry was first created
 * @param {Date} [aSpec.lastUsed]
 *        The time the entry was last accessed
 * @param {String} [aSpec.guid]
 *        GUID of the value
 * @param {Date} [aSpec.firstUsedStart]
 *        Entries created after or at this time
 * @param {Datet} [aSpec.firstUsedEnd]
 *        Entries created before or at this time
 * @param {Date} [aSpec.lastUsedStart]
 *        Entries last accessed after or at this time
 * @param {Date} [aSpec.lastUsedEnd]
 *        Entries last accessed before or at this time
 */
function clear(aSpec) {
  var spec = aSpec || {};
  spec.op = "remove";

  var callback = new Callback();
  FormHistory.update(spec, callback);

  assert.waitFor(() => callback.completed, "Form history has been cleared");
}

/**
 * Returns results for a specific field following some filters
 * Results will contain 4 properties: text, textLowerCase, frecency & totalScore
 *
 * @param {Object} aSpec
 *        Information about the entries needed
 * @param {String} aSpec.fieldname
 *        Name of the field for which to get the results
 * @param {String} [aSpec.searchString]
 *        The string to search for, typically the entered value of a textbox
 * @param {Object} [aSpec.agedWeight]
 * @param {Object} [aSpec.bucketSize]
 * @param {Date} [aSpec.expiryDate]
 * @param {Float} [aSpec.maxTimeGroupings]
 * @param {Float} [aSpec.timeGroupingSize]
 * @param {Float} [aSpec.prefixWeight]
 * @param {Float} [aSpec.boundaryWeight]
 *
 * @returns {Object[]} Autocomplete results that match the filters
 */
function getResults(aSpec) {
  var spec = aSpec || {};
  assert.equal(typeof spec.fieldname, "string", "Field Name not specified correctly");

  var searchString = spec.searchString || "";
  delete spec.searchString;

  var resultsArray = [];

  var callback = new Callback(aResult => resultsArray.push(aResult));
  FormHistory.getAutoCompleteResults(searchString, spec, callback);

  assert.waitFor(() => callback.completed, "Form History results retrieved");

  return resultsArray;
}

/**
 * Search for form data
 * Results will contain properties specified by aSpec.selectTerms
 *
 * @param {Object} [aSpec]
 *        Filters to apply for the searching
 * @param {Array} [aSpec.selectTerms=undefined]
 *        Array of terms (fields) to select for the entries
 *        If no terms selected, select everything
 * @param {String} [aSpec.fieldname]
 *        Name of the field for which to search the entries
 * @param {String} [aSpec.value]
 *        Value of the entry
 * @param {Number} [aSpec.timesUsed]
 *        Times the value was used
 * @param {Date} [aSpec.firstUsed]
 *        The time the the entry was first created
 * @param {Date} [aSpec.lastUsed]
 *        The time the entry was last accessed
 * @param {String} [aSpec.guid]
 *        GUID of the value
 * @param {Date} [aSpec.firstUsedStart]
 *        Entries created after or at this time
 * @param {Datet} [aSpec.firstUsedEnd]
 *        Entries created before or at this time
 * @param {Date} [aSpec.lastUsedStart]
 *        Entries last accessed after or at this time
 * @param {Date} [aSpec.lastUsedEnd]
 *        Entries last accessed before or at this time
 *
 * @returns {Object[]} Array of entries that match the filters
 */
function search(aSpec) {
  var spec = aSpec || {};
  var selectTerms = spec.selectTerms;

  delete spec.selectTerms;
  var resultsArray = [];

  var callback = new Callback(aResult => resultsArray.push(aResult));
  FormHistory.search(selectTerms, spec, callback);

  assert.waitFor(() => callback.completed,
                 "Form History search results retrieved");

  return resultsArray;
}

/**
 * Update form data
 * Update an entry with new information
 *
 * @param {Object} aSpec
 *        Information about changes we want to do
 * @param {String} aSpec.guid
 *        Guid of the entry to be updated
 * @param {Boolean} [aSpec.bump="update"]
 *        Check if the update it's actually a bump of an entry
 * @param {String} [aSpec.value]
 *        Value of the entry
 * @param {Number} [aSpec.timesUsed]
 *        Times the value was used
 * @param {Date} [aSpec.firstUsed]
 *        The time the the entry was first created
 * @param {Date} [aSpec.lastUsed]
 *        The time the entry was last accessed
 * @param {String} [aSpec.newGUID]
 *        New GUID to change to
 * @param {Date} [aSpec.firstUsedStart]
 *        Entries created after or at this time
 * @param {Datet} [aSpec.firstUsedEnd]
 *        Entries created before or at this time
 * @param {Date} [aSpec.lastUsedStart]
 *        Entries last accessed after or at this time
 * @param {Date} [aSpec.lastUsedEnd]
 *        Entries last accessed before or at this time
 */
function update(aSpec) {
  var spec = aSpec || {};
  assert.ok(spec.guid, "Guid not specified correctly");

  spec.op = spec.bump ? "bump" : "update";
  delete spec.bump;

  var callback = new Callback();
  FormHistory.update(spec, callback);

  // Wait for the update to end
  assert.waitFor(() => callback.completed, "Form history has been updated");
}

// Export of functions

exports.add = add;
exports.count = count;
exports.clear = clear;
exports.getResults = getResults;
exports.search = search;
exports.update = update;
