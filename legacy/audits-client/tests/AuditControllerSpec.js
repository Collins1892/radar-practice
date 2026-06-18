describe('AuditController', function () {
  'use strict';

  var $controller;
  var $rootScope;
  var $location;
  var AuditService;
  var AUDIT_STATUSES;

  var sampleAudits = [
    {
      Id: 1,
      Title: 'Hand Hygiene Compliance — Ward 4B',
      Description: 'Quarterly observational audit.',
      AuditDate: '2026-03-12T00:00:00',
      Status: 'Completed',
      CreatedBy: 'quality.team'
    },
    {
      Id: 2,
      Title: 'Medication Storage — Pharmacy Fridge',
      Description: 'Cold-chain storage checklist.',
      AuditDate: '2026-05-20T00:00:00',
      Status: 'In Progress',
      CreatedBy: 'pharmacy.audit'
    }
  ];

  beforeEach(module('auditsApp'));

  beforeEach(inject(function (_$controller_, _$rootScope_, _$location_, _AuditService_, _AUDIT_STATUSES_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $location = _$location_;
    AuditService = _AuditService_;
    AUDIT_STATUSES = _AUDIT_STATUSES_;
  }));

  function createController(routeParams) {
    var scope = $rootScope.$new();
    var vm;

    spyOn(AuditService, 'getAll').and.returnValue({
      then: function (success) {
        success(sampleAudits);
        return { catch: angular.noop, finally: function (fn) { fn(); return this; } };
      }
    });

    vm = $controller('AuditController', {
      $scope: scope,
      $routeParams: routeParams || {},
      $location: $location,
      AuditService: AuditService,
      AUDIT_STATUSES: AUDIT_STATUSES
    });

    scope.$digest();
    return { scope: scope, vm: scope.vm };
  }

  it('loads audits on list view', function () {
    // Arrange
    spyOn($location, 'path').and.returnValue('/');

    // Act
    var ctx = createController();

    // Assert
    expect(AuditService.getAll).toHaveBeenCalled();
    expect(ctx.vm.audits.length).toBe(2);
    expect(ctx.vm.isForm).toBe(false);
  });

  it('paginates audit list', function () {
    // Arrange
    spyOn($location, 'path').and.returnValue('/');
    var ctx = createController();
    ctx.vm.pageSize = 1;

    // Act
    var items = ctx.vm.pageItems();

    // Assert
    expect(items.length).toBe(1);
    expect(ctx.vm.totalPages()).toBe(2);
  });

  it('assigns status label class', function () {
    // Arrange
    spyOn($location, 'path').and.returnValue('/');
    var ctx = createController();

    // Act & Assert
    expect(ctx.vm.statusClass('Completed')).toBe('label-success');
    expect(ctx.vm.statusClass('In Progress')).toBe('label-warning');
    expect(ctx.vm.statusClass('Scheduled')).toBe('label-info');
  });

  it('enters edit mode when route has id', function () {
    // Arrange
    spyOn($location, 'path').and.returnValue('/edit/1');
    spyOn(AuditService, 'getById').and.returnValue({
      then: function (success) {
        success(sampleAudits[0]);
        return { catch: angular.noop, finally: function (fn) { fn(); return this; } };
      }
    });

    // Act
    var scope = $rootScope.$new();
    var vm = $controller('AuditController', {
      $scope: scope,
      $routeParams: { id: '1' },
      $location: $location,
      AuditService: AuditService,
      AUDIT_STATUSES: AUDIT_STATUSES
    });
    scope.$digest();

    // Assert
    expect(scope.vm.isEdit).toBe(true);
    expect(scope.vm.isForm).toBe(true);
    expect(AuditService.getById).toHaveBeenCalledWith('1');
  });
});
