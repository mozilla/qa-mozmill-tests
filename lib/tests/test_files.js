/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var files = require("../files");

const TEST_DATA = "lorem ipsum";

function testReadFile() {
  var resource = files.getProfileResource(["extensions",
                                           "mozmill@mozilla.com",
                                           "install.rdf"]);
  var file = new files.File(resource);
  assert.ok(file.contents.contains('<em:name>Mozmill</em:name>'),
            "File contents were properly read");
}

function testRemoveFile() {
  var file = new files.File(files.getProfileResource("test.file"));

  // Trying to remove a nonexitant file should not throw
  file.remove();
  assert.ok(!file.exists, "File does not exist on disk");

  // Write the file to disk
  file.contents = TEST_DATA;
  assert.ok(file.exists, "File exists on disk");

  // Remove the file
  file.remove();
  assert.ok(!file.exists, "File does not exist on disk");
}

function testProfileLocation() {
  var file1 = files.getProfileResource("nonexistant.file");
  var file2 = files.getProfileResource();

  file2.append("nonexistant.file");

  // getProfileResource returns the profile path when called with no arguments
  assert.equal(file1.path, file2.path, "getProfileResource() called without " +
                                       "arguments returns the profile location");
}

function testWriteFile() {
  var file = new files.File(files.getProfileResource("test.file"));
  file.contents = "lorem ipsum";
  assert.ok(file.contents === "lorem ipsum");
}
