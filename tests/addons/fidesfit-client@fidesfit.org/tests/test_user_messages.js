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
 * This file has tests regarding the behavior of the retrieval and processing of.
 * user messages. A net mockup is used so that this test can be run without
 * needing to have an account at the Fidesfit services and doing actual calls to it.
 */

/**
 * Namespace
 */
var fidesfit = (typeof fidesfit == 'undefined') ? {}: fidesfit;

Cu.import('resource://mozmill/modules/jum.js');
Cu.import('resource://fidesfit-modules/defs.jsm', fidesfit);
Cu.import('resource://fidesfit-modules/config.jsm', fidesfit);
Cu.import('resource://fidesfit-modules/state.jsm', fidesfit);

var fidesfit_helper_module = require('../lib/fidesfit_helper');
var net = require('../lib/net');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  fidesfit_helper = new fidesfit_helper_module.FidesfitHelper(controller);

  persisted.original_fetch_delay_initial =
    fidesfit.config.get('message.fetch_delay_initial');
  // Configuring for immediate fetching
  fidesfit.config.set('message.fetch_delay_initial', 0);

  // Monkey-patching the net module so that it provides
  // URL suggestions without having to be connected to a Fidesfit server.
  net.mockup.setup({ controller: controller });

  // Setting user ID and password otherwise the extension complains that it is
  // not filled.
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

  fidesfit.config.set('message.fetch_delay_initial',
    persisted.original_fetch_delay_initial);

  // Making sure that no notification CSS class and other techniques used in the
  // user messages are left over.
  fidesfit_helper.loadClientJs(fidesfit);
  fidesfit.client.triggerUserMessageFetching(false);
};

var testUserMessageNotifications = function() {
  //fidesfit.config.enableAllLogging();
  fidesfit_helper.openAddonBarIfExisting();

  fidesfit_helper.loadClientJs(fidesfit);

  fidesfit.client.triggerUserMessageFetching(false);
  fidesfit.client.triggerUserMessageFetching(true);

  // Waiting until there are some user messages retrieved
  // (the net mockup returns a "use_suggestions" user message).
  controller.waitFor(function() {
    return fidesfit.state.getAllUserMessagesCount() !== 0;
    }
  );

  // Verifying that the fetching has only made one call
  assertEquals(1, net.mockup.calls_count);

  // Verifying that fetching user messages fill the user_messages queue
  // (the net mockup returns a "use_suggestions" user message).
  var user_messages = fidesfit.state.getAllUserMessages();
  var user_messages_count = fidesfit.state.getAllUserMessagesCount();
  assertEquals(1, user_messages_count);
  assertNotUndefined(user_messages['use_suggestions']);

  var elem = fidesfit_helper.getElement({ type: 'statusbar-suggest' }).getNode();
  controller.waitFor(function() {
    // Verifying that a visual notification appears
    return elem.classList.contains(fidesfit.defs.NOTIFICATION_CLASS);
    }
  );

  // Verifying that a click on the visual notification consumes the user
  // message and there isn't any more user messages in the end.
  controller.waitThenClick(fidesfit_helper.
    getElement({ type: 'statusbar-suggest' }));
  controller.waitFor(function() {
    return fidesfit.state.getAllUserMessagesCount() === 0;
    },
    "User messages count is " + fidesfit.state.getAllUserMessagesCount() +
      " while it should be 0"
  );
};
