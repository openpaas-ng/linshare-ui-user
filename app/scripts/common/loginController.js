/**
 * loginController Controller
 * @namespace linshareUiUserApp
 */
(function() {
  'use strict';

  angular
    .module('linshareUiUserApp')
    .controller('loginController', loginController);

  loginController.$inject = [
    '$translate',
    'authenticationRestService',
    'lsAppConfig',
    'toastService'
  ];

  /**
   * @namespace loginController
   * @desc Manage login page
   * @memberOf linshareUiUserApp
   */
  function loginController($translate, authenticationRestService, lsAppConfig, toastService) {
    /* jshint validthis: true */
    var loginVm = this;

    loginVm.email = '';
    loginVm.lsAppConfig = lsAppConfig;
    loginVm.password = '';
    loginVm.submitForm = submitForm;

    activate();

    ////////////

    /**
     * @name activate
     * @desc Activation function of the controller, launch at every instantiation
     * @memberOf linshareUiUserApp.loginController
     */
    function activate() {
      loginVm.inputType = lsAppConfig.loginWithMailOnly ? 'email' : 'text';
    }

    /**
     * @name submitForm
     * @desc Submit login form to login user
     * @memberOf linshareUiUserApp.loginController
     */
    function submitForm() {
      authenticationRestService.login(loginVm.email, loginVm.password)
        .then(function(user) {
          toastService.info({
            key: 'LOGIN.NOTIFICATION.SUCCESS',
            params: {
              firstName: user.firstName
            }
          });
        })
        .catch(function(error) {
          switch (error.status) {
            case 401:
              toastService.error({key: 'LOGIN.NOTIFICATION.ERROR'});
              break;
          }
        });
    }
  }
})();
