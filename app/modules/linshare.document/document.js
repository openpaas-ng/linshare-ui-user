'use strict';
/**
 * @ngdoc overview
 * @name linshare.document
 * @description
 *
 * # LinshareDocumentService
 * Service of the linshare.document module
 */

angular.module('linshare.document', ['restangular'])
/**
 * @ngdoc service
 * @name linshare.document.service:LinshareDocumentService
 * @description
 *
 * Service dealing with documents
 */
  .factory('LinshareDocumentService', function(Restangular, $log) {
    var baseRestDocuments = Restangular.all('documents');
    var baseRestShares = Restangular.all('shares');
    return {
      getAllFiles: function() {
        $log.debug('FileService:getAllFiles');
        return baseRestDocuments.getList();
      },
      getFileInfo: function(uuid) {
        $log.debug('FileService:getFileInfo');
        return Restangular.one('documents', uuid).get();
      },
      downloadFiles: function(uuid) {
        $log.debug('FileService:downloadFiles');
        return Restangular.all('documents').one(uuid, 'download').get();
      },
      getThumbnail: function(uuid) {
        $log.debug('FileService:getThumbnail');
        return Restangular.one('documents', uuid).one('thumbnail').get();
      },
      uploadFiles: function(documentDto) {
        $log.debug('FileService:uploadFiles');
        return Restangular.all('documents').post(documentDto);
      },
      delete: function(uuid) {
        $log.debug('FileService:deleteFiles');
        return Restangular.one('documents', uuid).remove();
      },
      autocomplete: function(pattern) {
        $log.debug('FileService:autocomplete');
        return Restangular.all('users').one('autocomplete', pattern).get();
      },
      updateFile: function(uuid, documentDto) {
        $log.debug('LinshareDocumentService : updating a document');
        return Restangular.all('documents').post('')
      }
      //editFile,
    };
  })
/**
 * @ngdoc controller
 * @name linshare.document.controller:LinshareDocumentController
 * @description
 *
 * The controller to manage documents
 */
  .controller('LinshareDocumentController', function($scope,  $filter, LinshareDocumentService, ngTableParams, $window, $log, documentsList, growlService) {

    $scope.download = function() {
      angular.forEach($scope.SelectedElement, function(uuid){
        LinshareDocumentService.downloadFiles(uuid).then(function(file) {
          console.log(file);
          var blob = new Blob([file], {type: 'text/plain'});
          $scope.url = window.URL.createObjectURL(blob);
          console.log('url', $scope.url);
          // $window.open(url);
          //return file;
        });
      });
    };

    $scope.editProperties = function(restangObject) {
      restangObject.save();
    };

    var removeElementFromCollection = function(collection, element) {
      var index = collection.indexOf(element);
      if (index > -1) {
        collection.splice(index, 1);
      }
    };

    $scope.deleteSelected = function() {
      swal({
          title: "Are you sure?",
          text: "You are about to remove " + $scope.selectedDocuments.length + " file(s) !",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "cancel!",
          closeOnConfirm: true,
          closeOnCancel: true
        },
        function(isConfirm) {
          if (isConfirm) {
            angular.forEach($scope.selectedDocuments, function(document) {
              $log.debug('value to delete', document);
              $log.debug('value to delete', documentsList.length);
              documentsList.one(document.uuid).remove().then(function() {
                removeElementFromCollection(documentsList, document);
                removeElementFromCollection($scope.selectedDocuments, document);
                $scope.tableParams.reload();
                growlService.growl('suppression réussie', 'inverse');
              });
            });
          }
        });
    };

    $scope.documentDetails = 'test ';

    $scope.$watch('selectedDocuments', function(n) {
      if(n.length != 1) {
        $log.debug('watcher ******', $scope.mactrl, n);
        $scope.mactrl.sidebarToggle.right = false;
      }
    }, true);

    //NEVER EVER : TO REMOVE ASAP
    $scope.close = function() {
      document.getElementsByTagName('section')[3].style.className = 'col-md-12';
      document.getElementsByTagName('section')[4].style.display = 'none';

    };

    $scope.reload = function() {
      $scope.tableParams.reload();
      console.log('hqfsmlkdhfmqlskhd', documentsList);
    };

    $scope.tableParams = new ngTableParams({
      page: 1,
      sorting: {modificationDate: 'desc'},
      count: 20
    }, {
      getData: function($defer, params) {
          var files =  params.sorting() ? $filter('orderBy')(documentsList, params.orderBy()) : documentsList;
          params.total(files.length);
          $defer.resolve(files.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
    });
  });
