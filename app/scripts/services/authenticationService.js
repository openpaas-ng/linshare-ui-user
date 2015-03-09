'use strict';

/* Authentication Factory */

angular.module('linshareUiUserApp')
  .factory('AuthenticationService', function(Restangular, $q, $log, $cookies, authService, Session, $location) {
    var deferred = $q.defer();

    var baseAuthentication = Restangular.all('authentication');
    /*
     Check if the user is authorized
     */
    baseAuthentication.customGET('authorized')
      .then( function (userLoggedIn) {
        deferred.resolve(userLoggedIn);
      }, function(error) {
        $log.debug('current user not authenticated', error);
      });

    return {
      login: function (login, password) {
        $log.debug('Authentication:login');
        return baseAuthentication.customGET('authorized',{
          //while the all requests have no auth header we need to ignote authmodule
          ignoreAuthModule: true}, {
          Authorization: 'Basic ' + Base64.encode(login + ':' + password)
        }).then(function(user) {
          $log.debug('Authentication success : logged as ' + user.firstName + ' ' + user.lastName + '');
          authService.loginConfirmed();
          Session.create(user.uuid, user.role);
          deferred.resolve(user);
          console.log('resolveeee', deferred);
        }, function(error) {
          $log.error('Authentication failed', error.status);
          deferred.reject(error);
        });
      },
      logout: function() {
        $log.debug('Authentication:logout');
        baseAuthentication.one('logout').get()
          .then(function() {
            console.log('avant',$cookies.JSESSIONID);
            delete $cookies.JSESSIONID;
            authService.loginCancelled();
            console.log("apres cookie delete", $cookies.JSESSIONID);
            //After being disconnected, authentication model is reloaded
            //you can use $location to redirect through home page (login page)
            baseAuthentication.customGET('authorized').then(function(user) {
              deferred.resolve(user);
            });
          });
      },
      getCurrentUser: function() {
            return deferred.promise;
      }
    };
  });
