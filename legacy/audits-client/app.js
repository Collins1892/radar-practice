(function () {
  'use strict';

  var API_BASE = '/api/audits';

  var AUDIT_STATUSES = [
    'Scheduled',
    'In Progress',
    'Completed',
    'Cancelled'
  ];

  angular.module('auditsApp', ['ngRoute'])
    .constant('API_BASE', API_BASE)
    .constant('AUDIT_STATUSES', AUDIT_STATUSES)
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider
        .when('/', {
          templateUrl: 'views/audit-list.html',
          controller: 'AuditController',
          controllerAs: 'vm'
        })
        .when('/create', {
          templateUrl: 'views/audit-form.html',
          controller: 'AuditController',
          controllerAs: 'vm'
        })
        .when('/edit/:id', {
          templateUrl: 'views/audit-form.html',
          controller: 'AuditController',
          controllerAs: 'vm'
        })
        .otherwise({
          redirectTo: '/'
        });
    }]);
})();
