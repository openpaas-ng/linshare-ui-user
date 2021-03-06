/**
 * contactsListsListRestService
 * @namespace LinShare.contactsLists
 */
(function() {
  'use strict';

  angular
    .module('linshare.contactsLists')
    .factory('contactsListsListRestService', contactsListsListRestService);

  contactsListsListRestService.$inject = ['$log', 'Restangular', 'ServerManagerService'];

  /**
   * @namespace contactsListsListRestService
   * @descService to interact with ContactsListsList object by REST
   * @memberOf LinShare.contactsLists
   */
  function contactsListsListRestService($log, Restangular, ServerManagerService) {
    var
      handler = ServerManagerService.responseHandler,
      restUrl = 'contact_lists',
      service = {
        create: create,
        delete: remove,
        duplicate: duplicate,
        get: get,
        getAudit: getAudit,
        getList: getList,
        restangularize: restangularize,
        update: update
      };

    return service;

    ////////////

    /**
     * @name create
     * @desc Create a contactsList object
     * @param {Object} contactsListsDto - The contactsList object
     * @returns {Promise} server response
     * @memberOf LinShare.contactsLists.contactsListsListRestService
     */
    function create(contactsListsDto) {
      $log.debug('contactsListsListRestService - create');
      return handler(Restangular.all(restUrl).post(contactsListsDto));
    }

    /**
     * @name duplicate
     * @desc duplicate a contactsList object
     * @param {string} contactsListSourceUuid - The contactsList source uuid
     * @param {string} newContactsListName - The new contactsList name
     * @returns {Promise} server response
     * @memberOf LinShare.contactsLists.contactsListsListRestService
     */
    function duplicate(contactsListSourceUuid, newContactsListName) {
      $log.debug('contactsListsListRestService - duplicate');
      return handler(Restangular
        .all(restUrl)
        .one(contactsListSourceUuid)
        .one('duplicate')
        .one(newContactsListName)
        .post()
      );
    }

    /**
     * @name get
     * @desc Get a contactsList object
     * @param {String} contactsListsUuid - The uuid of a contactsList object
     * @returns {Promise} server response
     * @memberOf LinShare.contactsLists.contactsListsListRestService
     */
    function get(contactsListsUuid) {
      $log.debug('contactsListsListRestService - get', contactsListsUuid);
      return handler(Restangular.one(restUrl, contactsListsUuid).get());
    }

    /**
     * @name getAudit
     * @desc Get audit of a contactsList object
     * @param {string} contactsListsUuid - The uuid of the contactsList object
     * @returns {Promise} server response
     * @memberOf LinShare.contactsLists.contactsListsListRestService
     */
    function getAudit(contactsListsUuid) {
      $log.debug('contactsListsListRestService - getAudit', contactsListsUuid);
      return handler(Restangular.one(restUrl, contactsListsUuid).one('audit').get());
    }

    /**
     * @name getList
     * @desc Get list of all contactsList
     * @param {Boolean} getOnlyMine - the boolean to check if get my contactsLists or others's
     * @returns {Promise} server response
     * @memberOf LinShare.contactsLists.contactsListsListRestService
     */
    function getList(getOnlyMine) {
      $log.debug('contactsListsListRestService - getList');
      return handler(Restangular.all(restUrl).getList({mine: getOnlyMine}));
    }

    /**
     * @name remove
     * @desc Remove a contactsList object
     * @param {String} contactsListsUuid - The uuid of a contactsList object
     * @returns {Promise} server response
     * @memberOf LinShare.contactsLists.contactsListsListRestService
     */
    function remove(contactsListsUuid) {
      $log.debug('contactsListsListRestService - remove', contactsListsUuid);
      return handler(Restangular.one(restUrl, contactsListsUuid).remove());
    }

    /**
     * @name restangularize
     * @desc Restangularize an item
     * @param {Object} item - Item to be restangularized
     * @returns {Object} Restangularized object
     * @memberOf LinShare.contactsLists.contactsListsListRestService
     */
    function restangularize(item) {
      $log.debug('contactsListsListRestService - restangularize', item);
      return Restangular.restangularizeElement(null, item, restUrl);
    }

    /**
     * @name update
     * @desc Update a contactsList object
     * @param {Object} contactsListsDto - contactsList to update
     * @returns {Promise} server response
     * @memberOf LinShare.contactsLists.contactsListsListRestService
     */
    function update(contactsListsDto) {
      $log.debug('contactsListsListRestService - update');
      delete contactsListsDto.auditActions;
      return handler(Restangular.one(restUrl, contactsListsDto.uuid).customPUT(contactsListsDto));
    }
  }
})();
