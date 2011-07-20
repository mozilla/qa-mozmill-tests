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
 * Portions created by the Initial Developer are Copyright (C) 2011
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
Cu.import('resource://fidesfit-modules/config.jsm', fidesfit);
Cu.import('resource://fidesfit-modules/Services.jsm', fidesfit);

var prefs = require('../../../../lib/prefs');
var fidesfit_helper_module = require('../lib/fidesfit_helper');
var net = require('../lib/net');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  fidesfit_helper = new fidesfit_helper_module.FidesfitHelper(controller);

  suggest_image = fidesfit_helper.getElement({ type: 'statusbar-suggest' });

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

  fidesfit.config.set('additional_information.sidebar_auto_open', false);
};

var testSuggestImageClickInAutomaticMode = function() {
  //fidesfit.config.enableAllLogging();

  fidesfit_helper.openAddonBarIfExisting();

  fidesfit.config.set('request_mode.manual', false);
  fidesfit.config.set('additional_information.sidebar_auto_open', true);

  // This call doesn't remove the pages from history with Firefox 3.5,
  // that's why we have to put in as much URLs as that will be consumed by all
  // the tests in this module.
  fidesfit.Services.history.removeAllPages();

  // Monkey-patching this method so that it provides URL suggestions
  // without having to be connected to a Fidesfit server.
  net.mockup.setup({ controller: controller });

  controller.click(suggest_image);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // The activation image is no more displaying the "in progress" icon,
  // it's rather displaying the "activated" icon.
  controller.assertDOMProperty(suggest_image, 'src',
    fidesfit_helper.SUGGEST_IMAGE_URL);

  controller.middleClick(suggest_image);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // The activation image is no more displaying the "in progress" icon,
  // it's rather displaying the "activated" icon.
  controller.assertDOMProperty(suggest_image, 'src',
    fidesfit_helper.SUGGEST_IMAGE_URL);

  fidesfit_helper.loadClientJs(fidesfit);
  assertTrue(fidesfit.ui.isFidesfitSidebarOpen());

  net.mockup.teardown();
};

var testSuggestImageClickInManualMode = function() {
  //fidesfit.config.enableAllLogging();

  fidesfit_helper.openAddonBarIfExisting();

  fidesfit.config.set('request_mode.manual', true);
  fidesfit.config.set('additional_information.sidebar_auto_open', true);

  // This call doesn't remove the pages from history with Firefox 3.5,
  // that's why we have to put in as much URLs as that will be consumed by all
  // the tests in this module.
  fidesfit.Services.history.removeAllPages();

  // Monkey-patching this method so that it provides URL suggestions
  // without having to be connected to a Fidesfit server.
  net.mockup.setup({ controller: controller });

  controller.click(suggest_image);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // The activation image is no more displaying the "in progress" icon,
  // it's rather displaying the "activated" icon.
  controller.assertDOMProperty(suggest_image, 'src',
    fidesfit_helper.SUGGEST_IMAGE_URL);

  controller.middleClick(suggest_image);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // The activation image is no more displaying the "in progress" icon,
  // it's rather displaying the "activated" icon.
  controller.assertDOMProperty(suggest_image, 'src',
    fidesfit_helper.SUGGEST_IMAGE_URL);

  fidesfit_helper.loadClientJs(fidesfit);
  assertTrue(fidesfit.ui.isFidesfitSidebarOpen());

  net.mockup.teardown();
};

/**
 * The sidebar should be autoopened whether the suggested URL is a configured
 * theme or not.
 */
var testAutoOpenSidebarForHttps = function() {
  //fidesfit.config.enableAllLogging();

  fidesfit_helper.openAddonBarIfExisting();

  fidesfit.config.set('additional_information.sidebar_auto_open', true);
  fidesfit.config.set('request_mode.manual', true);

  // This is to avoid having a popup asking the user to go on even if there are
  // some HTTPS warnings.
  prefs.preferences.setPref('security.warn_viewing_mixed', false);

  fidesfit_helper.loadClientJs(fidesfit);

  // Be sure the sidebar is closed before testing later that it is opened
  // This is not possible because the fidesfit.ui.closeFidesfitSidebar method
  // relies on the browser.js toggleSidebar method that is not available in the
  // Mozmill context.
  //fidesfit.ui.closeFidesfitSidebar();

  // This call doesn't remove the pages from history with Firefox 3.5,
  // that's why we have to put in as much URLs as that will be consumed by all
  // the tests in this module.
  fidesfit.Services.history.removeAllPages();

  // Monkey-patching this method so that it provides URL suggestions
  // without having to be connected to a Fidesfit server.
  net.mockup.setup({ controller: controller, https_suggestions: true });

  controller.click(suggest_image);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // The activation image is no more displaying the "in progress" icon,
  // it's rather displaying the "activated" icon.
  controller.assertDOMProperty(suggest_image, 'src',
    fidesfit_helper.SUGGEST_IMAGE_URL);

  controller.middleClick(suggest_image);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // The activation image is no more displaying the "in progress" icon,
  // it's rather displaying the "activated" icon.
  controller.assertDOMProperty(suggest_image, 'src',
    fidesfit_helper.SUGGEST_IMAGE_URL);

  assertTrue(fidesfit.ui.isFidesfitSidebarOpen());

  net.mockup.teardown();
};