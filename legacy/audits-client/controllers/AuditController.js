(function () {
  'use strict';

  angular.module('auditsApp')
    .controller('AuditController', [
      '$routeParams',
      '$location',
      'AuditService',
      'AUDIT_STATUSES',
      function ($routeParams, $location, AuditService, AUDIT_STATUSES) {
        var vm = this;

        vm.audits = [];
        vm.audit = blankAudit();
        vm.statuses = AUDIT_STATUSES;
        vm.loading = false;
        vm.error = null;
        vm.isEdit = false;
        vm.isForm = false;

        vm.currentPage = 1;
        vm.pageSize = 5;

        vm.totalPages = totalPages;
        vm.pageItems = pageItems;
        vm.goToPage = goToPage;
        vm.loadAudits = loadAudits;
        vm.loadAudit = loadAudit;
        vm.save = save;
        vm.remove = remove;
        vm.cancel = cancel;
        vm.statusClass = statusClass;

        activate();

        function activate() {
          var path = $location.path();
          vm.isForm = path === '/create' || path.indexOf('/edit/') === 0;

          if (vm.isForm) {
            if ($routeParams.id) {
              vm.isEdit = true;
              loadAudit($routeParams.id);
            } else {
              vm.audit = blankAudit();
            }
          } else {
            loadAudits();
          }
        }

        function blankAudit() {
          return {
            Id: 0,
            Title: '',
            Description: '',
            AuditDate: new Date().toISOString().substring(0, 10),
            Status: 'Scheduled',
            CreatedBy: ''
          };
        }

        function loadAudits() {
          vm.loading = true;
          vm.error = null;

          AuditService.getAll()
            .then(function (data) {
              vm.audits = data;
              vm.currentPage = 1;
            })
            .catch(function () {
              vm.error = 'Unable to load audits. Please try again.';
            })
            .finally(function () {
              vm.loading = false;
            });
        }

        function loadAudit(id) {
          vm.loading = true;
          vm.error = null;

          AuditService.getById(id)
            .then(function (data) {
              vm.audit = data;
              if (vm.audit.AuditDate && vm.audit.AuditDate.indexOf('T') > -1) {
                vm.audit.AuditDate = vm.audit.AuditDate.substring(0, 10);
              }
            })
            .catch(function () {
              vm.error = 'Audit not found.';
            })
            .finally(function () {
              vm.loading = false;
            });
        }

        function save() {
          vm.error = null;
          vm.loading = true;

          var action = vm.isEdit
            ? AuditService.update(vm.audit)
            : AuditService.create(vm.audit);

          action
            .then(function () {
              $location.path('/');
            })
            .catch(function (response) {
              vm.error = (response.data && response.data.Message)
                ? response.data.Message
                : 'Save failed. Check required fields.';
            })
            .finally(function () {
              vm.loading = false;
            });
        }

        function remove(audit) {
          if (!window.confirm('Delete audit "' + audit.Title + '"?')) {
            return;
          }

          vm.loading = true;
          AuditService.remove(audit.Id)
            .then(function () {
              loadAudits();
            })
            .catch(function () {
              vm.error = 'Unable to delete audit.';
              vm.loading = false;
            });
        }

        function cancel() {
          $location.path('/');
        }

        function totalPages() {
          return Math.ceil(vm.audits.length / vm.pageSize) || 1;
        }

        function pageItems() {
          var start = (vm.currentPage - 1) * vm.pageSize;
          return vm.audits.slice(start, start + vm.pageSize);
        }

        function goToPage(page) {
          if (page < 1 || page > totalPages()) {
            return;
          }
          vm.currentPage = page;
        }

        function statusClass(status) {
          switch (status) {
            case 'Completed':
              return 'label-success';
            case 'In Progress':
              return 'label-warning';
            case 'Cancelled':
              return 'label-default';
            default:
              return 'label-info';
          }
        }

      }
    ]);
})();
