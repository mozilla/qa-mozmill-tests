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
 * This file has tests regarding the behavior of the statusbar that has been
 * modified with a Fidesfit specific panel.
 */

/**
 * Namespace
 */
var fidesfit = (typeof fidesfit == 'undefined') ? {}: fidesfit;

Cu.import('resource://mozmill/modules/jum.js');
Cu.import('resource://fidesfit-modules/defs.jsm', fidesfit);
Cu.import('resource://fidesfit-modules/config.jsm', fidesfit);

var utils = require('../../../../lib/utils');
var fidesfit_helper_module = require('../lib/fidesfit_helper');
var net = require('../lib/net');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  fidesfit_helper = new fidesfit_helper_module.FidesfitHelper(controller);

  // Monkey-patching the net module so that it provides
  // scores for non-useless web pages without having to be connected to a
  // Fidesfit server.
  net.mockup.setup({ controller: controller });

  fidesfit.config.set('user.id', 'test1@orseis.com');
  fidesfit.config.setPassword('secret', 'test1@orseis.com');
  fidesfit.config.set('services.provider.url', 'http://localhost:3000/');
};

var teardownModule = function(module) {
  // MANDATORY: ALWAYS teardown the mockup in teardownModule if a mockup is
  // used somewhere in the test file. This is because otherwise if a test fails
  // the following tests in the other test files will get an active mockup while
  // they are not expecting any.
  net.mockup.teardown();
};

var testOpinionImageClick = function() {
  //fidesfit.config.enableAllLogging();

  // Important : The addon-bar (status-bar) needs to be open since the
  // opinion-panel is anchored on it. Not opening the addon-bar will cause this
  // test to fail.
  fidesfit_helper.openAddonBarIfExisting();

  fidesfit_helper.manual_request_mode = false;

  var active_tab_index;
  active_tab_index = controller.tabs.activeTabIndex;

  // Opening a useless URL (defined as such by the decision.jsm module)
  fidesfit_helper.openUrlInNewTab('about:blank');

  // Waiting to effectively be on the next tab
  controller.waitFor(function() {
    return controller.tabs.activeTabIndex === active_tab_index++;
    }
  );

  // Clicking the "Give opinion" image produces nothing on a useless URL
  controller.waitFor(function() {
      return fidesfit_helper.getElement({ type: 'statusbar-opinion' }).
        getNode().classList.contains(fidesfit.defs.DISABLED_CLASS);
    },
    "Timeout exceeded for callback to happen to be true. " +
    "class: [" + fidesfit_helper.getElement({ type: 'statusbar-opinion' }).
    getNode().className + "]"
  );

  controller.click(
    fidesfit_helper.getElement({ type: 'statusbar-opinion' }));
  controller.sleep(2000);
  utils.assertElementVisible(controller,
    fidesfit_helper.getElement({ type: 'opinion-panel' }), false);

  controller.sleep(2000);

  active_tab_index = controller.tabs.activeTabIndex;
  fidesfit_helper.openUrlInNewTab('http://ec.europa.eu/');

  // Waiting to effectively be on the next tab
  controller.waitFor(function() {
    return controller.tabs.activeTabIndex === active_tab_index++;
    }
  );

  // Clicking the opinion image opens up the opinion panel this time
  //
  // Waiting that the "Give opinion" button is enabled
  controller.waitFor(function() {
    return !fidesfit_helper.getElement({ type: 'statusbar-opinion' }).
        getNode().classList.contains(fidesfit.defs.DISABLED_CLASS);
    }
  );
  controller.click(
    fidesfit_helper.getElement({ type: 'statusbar-opinion' }));

  // Let the time for the panel to fully appear
  controller.waitFor(function() {
    return fidesfit_helper.getElement({ type: 'opinion-panel' }).
        getNode().state === 'open';
    }
  );
  utils.assertElementVisible(controller,
    fidesfit_helper.getElement({ type: 'opinion-panel' }), true);

  // Clicking on the score
  controller.click(
    fidesfit_helper.getElement( { type: 'rating-3' }));

  // Filling out the input textbox
  //
  // TODO: Why does the text here only appear when *all* the tests are run,
  // and not when only this specific test is run?
  controller.waitFor(function() {
    return fidesfit_helper.getElement({ type: 'input-box' }).
        getNode().hidden === false;
    }
  );
  var input_textbox = fidesfit_helper.getElement({ type: 'opinion-input' });
  controller.type(input_textbox, "Here goes my useful comment!");

  // Waiting that the "Post opinion" button is enabled
  controller.waitFor(function() {
    return fidesfit_helper.getElement({ type: 'rating-box-post-button' }).
        getNode().hidden === false;
    }
  );

  // Clicking the Cancel button
  controller.click(
    fidesfit_helper.getElement({ type: 'rating-box-cancel-button' }));

  // Let the time for the panel to fully disappear
  controller.waitFor(function() {
    return fidesfit_helper.getElement({ type: 'opinion-panel' }).
        getNode().state === 'closed';
    }
  );
  utils.assertElementVisible(controller,
    fidesfit_helper.getElement({ type: 'opinion-panel' }), false);
};
