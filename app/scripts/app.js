'use strict';

/**
 * @ngdoc overview
 * @name linshareUiUserApp
 * @description
 * # linshareUiUserApp
 *
 * Main module of the application.
 */
angular
  .module('linshareUiUserApp', [
    'ngAnimate',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'restangular',
    'ngTable',
    'http-auth-interceptor'
  ])
  .config(function(RestangularProvider) {
    RestangularProvider.setBaseUrl('linshare');
    RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json'});
    RestangularProvider.addFullRequestInterceptor(function (element, operation, route, url, headers) {
      headers['WWW-No-Authenticate'] = 'linshare';
    });
  })
  .config(function ($routeProvider) {
    $routeProvider
      .when('/home', {
        templateUrl: 'views/home/home.html',
        controller: 'HomeController',
        resolve: {
          user: function(AuthenticationService){
            return AuthenticationService.getCurrentUser();
          }
        }
      })
      .when('/login', {
        templateUrl: 'views/common/loginForm.html',
        controller: 'AuthenticationController'
      })
      .when('/files', {
        templateUrl: 'views/documents/files.html',
        controller: 'FilesController'
        //resolve: {
        //  user: function(AuthenticationService) {
        //    console.log('curentuser from files resolve' , AuthenticationService.getCurrentUser());
        //    return AuthenticationService.getCurrentUser();
        //  }
        //}
      })
      .when('/received', {
        templateUrl: 'views/documents/received.html',
        controller: 'ReceivedController',
        resolve: {
          user: function(AuthenticationService) {
            return AuthenticationService.getCurrentUser();
          }
        }
      })
      .when('/threads', {
        templateUrl: 'views/threads/thread.html',
        controller: 'ThreadController'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(function($rootScope, $location, AuthenticationService){
    $rootScope.$on('$routeChangeStart', function(evt, next, current) {
      var nexturl = next;
      $rootScope.$on('event:auth-loginRequired', function(){
        $location.path('/login');
      });
      $rootScope.$on('event:auth-loginConfirmed', function(){
        console.log('NEXTMQSDJ',nexturl, evt);
        $location.path('/' + nexturl.templateUrl);
      });
      //console.log(AuthenticationService.getCurrentUser());
      //if(!AuthenticationService.getCurrentUser()){
      //  if(next.templateUrl === 'login.html') {
	  //
      //  } else {
      //    $location.path('/login');
      //  }
      //}
    });
    //$rootScope.$on('event:auth-loginRequired', function(){
    //  $location.path('/login');
    //  console.log('scope $on', '$location.path()');
    //});
    //$rootScope.$on('event:auth-loginConfirmed', function(evt, next, current){
    //  console.log('rootscope $on', 'auth confirmed');
    //  $location.path('/'+ next.templateUrl);
    //});
  });
