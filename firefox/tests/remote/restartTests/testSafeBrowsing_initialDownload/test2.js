/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

const TIMEOUT = 30000;
const FILE_NAMES = [
  "goog-phish-shavar.cache",
  "goog-phish-shavar.pset",
  "goog-phish-shavar.sbstore",
  "goog-malware-shavar.cache",
  "goog-malware-shavar.pset",
  "goog-malware-shavar.sbstore",
  "goog-badbinurl-shavar.cache",
  "goog-badbinurl-shavar.pset",
  "goog-badbinurl-shavar.sbstore"
];
const WIN_FILE_NAMES = [
  "goog-downloadwhite-digest256.cache",
  "goog-downloadwhite-digest256.pset",
  "goog-downloadwhite-digest256.sbstore"
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.filesLocation = Services.dirsvc.get("ProfD", Ci.nsIFile);
  aModule.filesLocation.appendRelativePath("safebrowsing");
}

/**
 * Check if browser correctly downloads the safebrowsing files
 */
function testSafeBrowsing_initialDownload() {
  verifyFilesExistence(FILE_NAMES, filesLocation);

  if (mozmill.isWindows) {
    verifyFilesExistence(WIN_FILE_NAMES, filesLocation);
  }
  else {
    // wait for the Windows specific files to appear
    controller.sleep(2000);

    WIN_FILE_NAMES.forEach(aFileName => {
      let file = filesLocation.clone();
      file.appendRelativePath(aFileName);

      expect.ok(!file.exists(), file.path + " was not downloaded");
    });
  }
}

function verifyFilesExistence(aFileNames, aLocation) {
  aFileNames.forEach(aFileName => {
    let file = aLocation.clone();
    file.appendRelativePath(aFileName);

    expect.waitFor(() => file.exists(),
                   file.path + " exists", TIMEOUT);
  });
}
