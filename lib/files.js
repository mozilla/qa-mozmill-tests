/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var files = exports;

// Include required modules
var { assert, expect } = require("assertions");


/**
 * Read the contents of a file as text
 *
 * @param {nsIFile} aFile
 *        File to read the contents from as text
 *
 * @returns {string} File contents
 */
function readFile(aFile) {
  assert.ok(aFile.exists(), "Specified file has been found: " + aFile.path);

  var fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                createInstance(Ci.nsIFileInputStream);
  var cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].
                createInstance(Ci.nsIConverterInputStream);
  fstream.init(aFile, -1, 0, 0);
  cstream.init(fstream, "UTF-8", 0, 0);

  var data = "";
  var str = {};
  var read = 0;

  do {
    read = cstream.readString(0xffffffff, str);
    data += str.value;
  } while (read != 0);

  cstream.close();

  return data;
}

/**
 * Write the specified contents to a file
 *
 * @param {nsIFile} aFile
 *        File to write the contents to
 * @param {string} aContents
 *        Contents to write
 */
function writeFile(aFile, aContents) {
  assert.ok(aFile.exists(), "Specified file has been found: " + aFile.path);

  var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                 .createInstance(Ci.nsIFileOutputStream);
  foStream.init(aFile, 0x02 | 0x08 | 0x20, -1, 0);
  foStream.write(aContents, aContents.length);
  foStream.close();
}

// Export of functions
exports.readFile = readFile;
exports.writeFile = writeFile;
