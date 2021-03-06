'use strict';
angular.module('linshare.sharedSpace')
  .config(['$translatePartialLoaderProvider', function($translatePartialLoaderProvider) {
    $translatePartialLoaderProvider.addPart('filesList');
    $translatePartialLoaderProvider.addPart('sharedspace');
  }])
  // TODO: Should dispatch some function to other service or controller
  /* jshint maxparams: false, maxstatements: false */
  .controller('SharedSpaceController', function(
    _,
    $filter,
    $log,
    $q,
    $scope,
    $state,
    $timeout,
    $transitions,
    $translate,
    auditDetailsService,
    documentUtilsService,
    filterBoxService,
    functionalityRestService,
    itemUtilsService,
    lsAppConfig,
    lsErrorCode,
    NgTableParams,
    toastService,
    workgroupMembersRestService,
    workgroupPermissionsService,
    workgroupRestService,
    workgroups,
    workgroupsPermissions,
    workgroupsRoles
  ) {
    var thisctrl = this;
    thisctrl.functionalities = {};
    thisctrl.roles = workgroupsRoles;
    thisctrl.permissions = workgroupsPermissions;
    thisctrl.canDeleteWorkgroups = false;
    thisctrl.canCreate = true;
    thisctrl.goToSharedSpaceTarget = goToSharedSpaceTarget;
    thisctrl.lsAppConfig = lsAppConfig;
    thisctrl.currentSelectedDocument = {};
    thisctrl.itemsList = workgroups;
    thisctrl.itemsListCopy = thisctrl.itemsList;
    thisctrl.selectedDocuments = [];
    thisctrl.addSelectedDocument = addSelectedDocument;
    thisctrl.showItemDetails = showItemDetails;
    thisctrl.paramFilter = {name: ''};
    thisctrl.currentWorkgroupMember = {};
    thisctrl.tableParams = new NgTableParams({
      page: 1,
      sorting: {modificationDate: 'desc'},
      count: 20,
      filter: thisctrl.paramFilter
    }, {
      getData: function(params) {
        var filteredData =
          params.filter() ? $filter('filter')(thisctrl.itemsList, params.filter()) : thisctrl.itemsList;
        var workgroups = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
        params.total(workgroups.length);
        params.settings({counts: filteredData.length > 10 ? [10, 25, 50, 100] : []});
        return (workgroups.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
    });
    thisctrl.deleteWorkGroup = deleteWorkGroup;
    thisctrl.mdtabsSelection = {
      selectedIndex: 0
    };

    var swalNewWorkGroupName, invalideNameTranslate;

    $translate(['ACTION.NEW_WORKGROUP', 'TOAST_ALERT.ERROR.RENAME_INVALID.REJECTED_CHAR'])
      .then(function(translations) {
        swalNewWorkGroupName = translations['ACTION.NEW_WORKGROUP'];
        invalideNameTranslate = translations['TOAST_ALERT.ERROR.RENAME_INVALID.REJECTED_CHAR']
          .replace('$rejectedChar', lsAppConfig.rejectedChar.join('-, -').replace(new RegExp('-', 'g'), '\''));
      });

    thisctrl.createWorkGroup = function() {
      filterBoxService.setFilters(false);
      thisctrl.paramFilter.name = '';
      var defaultNamePos = itemUtilsService.itemNumber(thisctrl.itemsList, swalNewWorkGroupName);
      var defaultName = defaultNamePos > 0 ?
        swalNewWorkGroupName + ' (' + defaultNamePos + ')' : swalNewWorkGroupName;
      createFolder(defaultName);
    };

    thisctrl.renameFolder = renameFolder;

    thisctrl.toggleFilterBySelectedFiles = toggleFilterBySelectedFiles;

    thisctrl.sortDropdownSetActive = function($event) {
      thisctrl.toggleSelectedSort = !thisctrl.toggleSelectedSort;
      var currTarget = $event.currentTarget;
      angular.element('.files .sort-dropdown a ').removeClass('selected-sorting').promise().done(function() {
        angular.element(currTarget).addClass('selected-sorting');
      });
    };

    thisctrl.resetSelectedDocuments = function() {
      delete thisctrl.tableParams.filter().isSelected;
      documentUtilsService.resetItemSelection(thisctrl.selectedDocuments);
    };

    var openSearch = function() {
      angular.element('#drop-area').addClass('search-toggled');
      angular.element('#top-search-wrap input').focus();
    };
    var closeSearch = function() {
      angular.element('#drop-area').removeClass('search-toggled');
      angular.element('#searchInMobileFiles').val('').trigger('change');
    };

    thisctrl.toggleSearchState = function() {
      if (!thisctrl.searchMobileDropdown) {
        openSearch();
      } else {
        closeSearch();
      }
      thisctrl.searchMobileDropdown = !thisctrl.searchMobileDropdown;
    };

    functionalityRestService.getAll().then(function(functionalities) {
      thisctrl.functionalities.contactsList = functionalities.CONTACTS_LIST.enable && functionalities.CONTACTS_LIST__CREATION_RIGHT.enable;
      thisctrl.functionalities.workgroup = functionalities.WORK_GROUP.enable && functionalities.WORK_GROUP__CREATION_RIGHT.enable;

      if (functionalities.WORK_GROUP__CREATION_RIGHT.enable) {
        thisctrl.fabButton = {
          actions: [{
            action: function() {
              return thisctrl.createWorkGroup();
            },
            label: 'WORKGROUPS_LIST.SHARED_FOLDER',
            icon: 'zmdi zmdi-plus',
          }]
        };
      }
    });


    thisctrl.currentPage = 'group_list';

    thisctrl.sortDropdownSetActive = function(sortField, $event) {
      thisctrl.toggleSelectedSort = !thisctrl.toggleSelectedSort;
      thisctrl.tableParams.sorting(sortField, thisctrl.toggleSelectedSort ? 'desc' : 'asc');
      var currTarget = $event.currentTarget;
      angular.element('.labeled-dropdown.open a').removeClass('selected-sorting').promise().done(function() {
        angular.element(currTarget).addClass('selected-sorting');
      });
    };

    thisctrl.loadSidebarContent = function(content) {
      $scope.mainVm.sidebar.setData(thisctrl);
      $scope.mainVm.sidebar.setContent(content);
      $scope.mainVm.sidebar.show();
    };

    /**
     * @name goToSharedSpaceTarget
     * @desc routing to the workgroup or files inside a workgroup
     * @param {object} event - event handle
     * @param {string} workgroupUuid - Uuid of the Workgroup
     * @param {string} name - name of workgroup
     * @memberOf Linshare.shareSpace.SareSpaceController
    */
    function goToSharedSpaceTarget(event, workgroupUuid, name) {
      event.stopPropagation();
      var element = angular.element($('td[uuid=' + workgroupUuid + ']').find('.file-name-disp'));
      if (element.attr('contenteditable') === 'false') {
        $state.go('sharedspace.workgroups.root', {workgroupUuid: workgroupUuid, workgroupName: name.trim()});
      }
    }

    thisctrl.flagsOnSelectedPages = {};

    thisctrl.selectDocumentsOnCurrentPage = function(data, page, selectFlag) {
      var currentPage = page || thisctrl.tableParams.page();
      var dataOnPage = data || thisctrl.tableParams.data;
      var select = selectFlag || thisctrl.flagsOnSelectedPages[currentPage];
      if (!select) {
        angular.forEach(dataOnPage, function(element) {
          if (!element.isSelected) {
            element.isSelected = true;
            thisctrl.selectedDocuments.push(element);
          }
        });

        thisctrl.flagsOnSelectedPages[currentPage] = true;
      } else {
        thisctrl.selectedDocuments = _.xor(thisctrl.selectedDocuments, dataOnPage);
        angular.forEach(dataOnPage, function(element) {
          if (element.isSelected) {
            element.isSelected = false;
            _.remove(thisctrl.selectedDocuments, function(n) {
              return n.uuid === element.uuid;
            });
          }
        });
        thisctrl.flagsOnSelectedPages[currentPage] = false;
      }

      thisctrl.canDeleteWorkgroups = $filter('canDeleteWorkgroups')(thisctrl.selectedDocuments, thisctrl.permissions);
    };

    function deleteWorkGroup(workgroups) {
      itemUtilsService.deleteItem(workgroups, itemUtilsService.itemUtilsConstant.WORKGROUP, deleteCallback);
    }

// TODO : show a single callback toast for multiple deleted items, and check if it needs to be plural or not
    function deleteCallback(items) {
      angular.forEach(items, function(restangularizedItem) {
        $log.debug('value to delete', restangularizedItem);
        restangularizedItem.remove().then(function() {
          toastService.success({key: 'TOAST_ALERT.ACTION.DELETE_SINGULAR'});
          _.remove(thisctrl.itemsList, restangularizedItem);
          _.remove(thisctrl.selectedDocuments, restangularizedItem);
          thisctrl.itemsListCopy = thisctrl.itemsList; // I keep a copy of the data for the filter module
          thisctrl.tableParams.reload();
          $scope.mainVm.sidebar.hide(items);

          updateFlagsOnSelectedPages();
        });
      });
    }

    function addSelectedDocument(document) {
      documentUtilsService.selectDocument(thisctrl.selectedDocuments, document);

      updateFlagsOnSelectedPages();

      thisctrl.canDeleteWorkgroups = $filter('canDeleteWorkgroups')(thisctrl.selectedDocuments, thisctrl.permissions);
    }

    /**
     * @name updateFlagsOnSelectedPages
     * @desc update flag according to the selected pages
     * @returns {Void}
     * @memberOf LinShare.sharedSpace.SharedSpaceController
     */
    function updateFlagsOnSelectedPages() {
      if (!thisctrl.itemsList.length) {
        thisctrl.flagsOnSelectedPages[thisctrl.tableParams.page()] = false;

        return;
      }

      if (!thisctrl.flagsOnSelectedPages[thisctrl.tableParams.page()] &&
        (thisctrl.itemsList.length === thisctrl.selectedDocuments.length)) {
        thisctrl.flagsOnSelectedPages[thisctrl.tableParams.page()] = true;
      }

      if (thisctrl.flagsOnSelectedPages[thisctrl.tableParams.page()] &&
        (thisctrl.itemsList.length !== thisctrl.selectedDocuments.length)) {
        thisctrl.flagsOnSelectedPages[thisctrl.tableParams.page()] = false;
      }
    }

    function toggleFilterBySelectedFiles() {
      if (thisctrl.tableParams.filter().isSelected) {
        delete thisctrl.tableParams.filter().isSelected;
      } else {
        thisctrl.tableParams.filter().isSelected = true;
      }
    }

    /**
     * @name getWorkgroupAudit
     * @desc Get audit details of a Workgroup
     * @param {Object} workgroup - Workgroup object
     * @returns {Promise} Workgroup object with audit details
     * @memberOf LinShare.sharedSpace.SharedSpaceController
     */
    function getWorkgroupAudit(workgroup) {
      return workgroupRestService.getAudit(workgroup.uuid).then(function(auditData) {
        auditDetailsService.generateAllDetails($scope.userLogged.uuid, auditData.plain()).then(function(auditActions) {
          workgroup.auditActions = auditActions;
        });
      });
    }

    /**
     * @name showItemDetails
     * @desc Get details of a Workgroup and show them in right sidebar
     * @param {string} workgroupUuid - Uuid of the Workgroup
     * @param {Object} event - Event happening
     * @param {boolean} memberTab - Open member tab
     * @memberOf LinShare.sharedSpace.SharedSpaceController
     */
    function showItemDetails(workgroupUuid, loadAction, memberTab) {
      workgroupRestService
        .get(workgroupUuid, true)
        .then(function(workgroup) {
          thisctrl.currentSelectedDocument.membersForContactsList = _.map(
            workgroup.members,
            function(member) {
              return { mail: member.userMail };
            }
          );

          thisctrl.currentSelectedDocument.current = workgroup;

          return workgroupRestService
            .getQuota(thisctrl.currentSelectedDocument.current.quotaUuid);
        })
        .then(function(quota) {
          thisctrl.currentSelectedDocument.current.quotas = quota;

          return getWorkgroupAudit(thisctrl.currentSelectedDocument.current);
        })
        .then(function() {
          if(loadAction) {
            openMemberTab(memberTab);
            thisctrl.loadSidebarContent(lsAppConfig.workgroupPage);
          }
        });

      /**
       * @name openMemberTab
       * @desc Check if we have to be on member tab on sidebar opening
       * @param {boolean} ifMemberTab - Open member tab
       * @memberOf LinShare.sharedSpace.SharedSpaceController
       */
      function openMemberTab(ifMemberTab) {
        if (ifMemberTab) {
          thisctrl.mdtabsSelection.selectedIndex = 1;
          //TODO Don't Use angular.element, Do a component/directive
          angular.element('#focusInputShare').focus();
        } else {
          thisctrl.mdtabsSelection.selectedIndex = 0;
        }
      }
    }

    function renameFolder(item, itemNameElem) {
      var itemNameElement = itemNameElem || 'td[uuid=' + item.uuid + '] .file-name-disp';

      return itemUtilsService
        .rename(item, itemNameElement)
        .then(function(newItemDetails) {
          item = _.assign(item, newItemDetails);
          thisctrl.canCreate = true;
          return workgroupPermissionsService
            .getWorkgroupsPermissions(workgroups);
        })
        .then(function(workgroupsPermissions) {
          thisctrl.permissions = Object.assign(
            {},
            thisctrl.permissions,
            workgroupPermissionsService.formatPermissions(workgroupsPermissions)
          );
        })
        .catch(function(response) {
          //TODO - Manage error from back
          var data = response.data;

          if (data.errCode === lsErrorCode.CANCELLED_BY_USER) {
            if (!item.uuid) {
              var itemListIndex = _.findIndex(thisctrl.itemsList, item);

              thisctrl.itemsList.splice(itemListIndex, 1);
            }
            thisctrl.canCreate = true;
          }
        })
        .finally(thisctrl.tableParams.reload);
    }

    function createFolder(folderName) {
      if (thisctrl.canCreate) {
        var workgroup = workgroupRestService.restangularize({name: folderName.trim()});

        thisctrl.canCreate = false;
        thisctrl.itemsList.push(workgroup);
        thisctrl.tableParams.reload();
        $timeout(function() {
          renameFolder(workgroup, 'td[uuid=""] .file-name-disp');
        }, 0);
      }
    }
  });
