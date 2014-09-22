/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var files = exports;

// Include required modules
var { assert, expect } = require("assertions");


const iniFactory = Cc["@mozilla.org/xpcom/ini-processor-factory;1"]
                   .getService(Ci.nsIINIParserFactory);


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
 * Class to handle INI files
 *
 * @param {nsIFile} aIniFile
 *        Reference to the INI file
 */
function INIFile(aIniFile) {
  this._file = aIniFile;
  this._parser = iniFactory.createINIParser(this._file);
  this._writer = iniFactory.createINIParser(this._file)
                           .QueryInterface(Ci.nsIINIParserWriter);
}

INIFile.prototype = {
  /**
   * Path of the INI file
   */
  get path() this._file.path,

  /**
   * Return the list of keys for the given section
   *
   * @param {string} aSection
   *        Name of the section to return the keys for
   *
   * @returns {string[]} Available keys
   */
  getKeys: function INI_getKeys(aSection) {
    var enumerator = this._parser.getKeys(aSection);
    var keys = [];

    while (enumerator && enumerator.hasMore()) {
      keys.push(enumerator.getNext());
    }

    return keys;
  },

  /**
   * Return the list of sections
   *
   * @returns {string[]} Available sections
   */
  getSections: function INI_getSections() {
    var enumerator = this._parser.getSections();
    var sections = [];

    while (enumerator && enumerator.hasMore()) {
      sections.push(enumerator.getNext());
    }

    return sections;
  },

  /**
   * Read the value of the given key
   *
   * @param {string} aSection
   *        Name of the section
   * @param {string} aKey
   *        Name of the key
   *
   * @returns {string} Value of the key
   */
  getValue: function INI_getValue(aSection, aKey) {
    return this._parser.getString(aSection, aKey);
  },

  /**
   * Write the value for the given key
   *
   * @param {string} aSection
   *        Name of the section
   * @param {string} aKey
   *        Name of the key
   * @param {string} aValue
   *        Data to be written
   */
  setValue: function INI_getValue(aSection, aKey, aValue) {
    this._writer.setString(aSection, aKey, aValue);
    this._writer.writeFile(null, Ci.nsIINIParserWriter.WRITE_UTF16);
  }
};

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

// Export of classes
exports.INIFile = INIFile;

// Export of functions
exports.readFile = readFile;
exports.writeFile = writeFile;
