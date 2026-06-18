(function () {
  'use strict';

  angular.module('auditsApp')
    .factory('AuditService', ['$http', 'API_BASE', function ($http, API_BASE) {
      function getAll() {
        return $http.get(API_BASE).then(function (response) {
          return response.data;
        });
      }

      function getById(id) {
        return $http.get(API_BASE + '/' + id).then(function (response) {
          return response.data;
        });
      }

      function create(audit) {
        return $http.post(API_BASE, audit).then(function (response) {
          return response.data;
        });
      }

      function update(audit) {
        return $http.put(API_BASE + '/' + audit.Id, audit).then(function (response) {
          return response.data;
        });
      }

      function remove(id) {
        return $http.delete(API_BASE + '/' + id);
      }

      return {
        getAll: getAll,
        getById: getById,
        create: create,
        update: update,
        remove: remove
      };
    }]);
})();
