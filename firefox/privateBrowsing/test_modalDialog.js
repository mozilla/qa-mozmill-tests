var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);
var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);

// Include modal dialog module

var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['modalDialogAPI'];

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  module.modalDialogAPI = collector.getModule('modalDialogAPI');
}

// Callback function for modal dialog
function handleDialog(controller) { 
  // check and uncheck to demonstrate that the controller is working
  dump("\n\n *** HANDLE DIALOG ***\n\n");
  controller.click(new elementslib.ID(controller.window.document, "checkbox"));
  controller.sleep(1000);
  controller.click(new elementslib.ID(controller.window.document, "checkbox"));
  controller.sleep(1000);

  // close the modal dialog  controller.window.document, '/id("commonDialog")/anon({"anonid":"buttons"})/{"label":"Start Private Browsing","icon":"accept","accesskey":"S","default":"true","step":"1","dlgtype":"accept","xbl:inherits":"disabled=buttondisabledaccept"}'));
  controller.click(new elementslib.Lookup(controller.window.document, '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}'));
}

// Enter Private Browsing mode twice to test several modal dialogs in a row
var testModalDialog = function() {
  md = new modalDialogAPI.modalDialog(handleDialog);

  md.start();
  controller.click(new elementslib.Elem(controller.menus['tools-menu'].privateBrowsingItem));
  controller.sleep(1000);
  controller.click(new elementslib.Elem(controller.menus['tools-menu'].privateBrowsingItem));
  controller.sleep(1000);
  
  md.start();
  controller.click(new elementslib.Elem(controller.menus['tools-menu'].privateBrowsingItem));
  controller.sleep(1000);
  controller.click(new elementslib.Elem(controller.menus['tools-menu'].privateBrowsingItem));
}

// Second test which will run after testModalDialog
var testTwo = function() {
  controller.open("http://www.google.com");
  controller.waitForPageLoad(controller.tabs.activeTab);
}
