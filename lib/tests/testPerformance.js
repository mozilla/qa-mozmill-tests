/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var performance = require("../performance");

function testPerfTracer() {
  var perfTracer = new performance.PerfTracer("testPerfTracer");

  for (var i = 0; i < 10; i++) {
    perfTracer.addCheckpoint("Checkpoint " + i);
    mozmill.controller.sleep(1000);
  }

  perfTracer.finish();
}
