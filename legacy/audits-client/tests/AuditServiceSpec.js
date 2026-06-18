describe('AuditService', function () {
  'use strict';

  var AuditService;
  var $httpBackend;
  var API_BASE = '/api/audits';

  var sampleAudit = {
    Id: 3,
    Title: 'Emergency Resuscitation Trolley Check',
    Description: 'Monthly verification of crash trolley contents.',
    AuditDate: '2026-06-01T00:00:00',
    Status: 'Scheduled',
    CreatedBy: 'clinical.safety'
  };

  beforeEach(module('auditsApp'));

  beforeEach(inject(function (_AuditService_, _$httpBackend_) {
    AuditService = _AuditService_;
    $httpBackend = _$httpBackend_;
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('getAll fetches audits from API', function () {
    // Arrange
    $httpBackend.expectGET(API_BASE).respond(200, [sampleAudit]);

    var result;
    AuditService.getAll().then(function (data) {
      result = data;
    });

    // Act
    $httpBackend.flush();

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].Title).toBe(sampleAudit.Title);
  });

  it('getById fetches a single audit', function () {
    // Arrange
    $httpBackend.expectGET(API_BASE + '/3').respond(200, sampleAudit);

    var result;
    AuditService.getById(3).then(function (data) {
      result = data;
    });

    // Act
    $httpBackend.flush();

    // Assert
    expect(result.Id).toBe(3);
    expect(result.Status).toBe('Scheduled');
  });

  it('create posts a new audit', function () {
    // Arrange
    var newAudit = {
      Title: 'Pressure Ulcer Prevention Review',
      Description: 'Quarterly skin integrity audit.',
      AuditDate: '2026-06-15',
      Status: 'Scheduled',
      CreatedBy: 'test.user'
    };

    $httpBackend.expectPOST(API_BASE, newAudit).respond(201, angular.extend({ Id: 10 }, newAudit));

    var result;
    AuditService.create(newAudit).then(function (data) {
      result = data;
    });

    // Act
    $httpBackend.flush();

    // Assert
    expect(result.Id).toBe(10);
  });

  it('update puts an existing audit', function () {
    // Arrange
    $httpBackend.expectPUT(API_BASE + '/3', sampleAudit).respond(200, sampleAudit);

    var result;
    AuditService.update(sampleAudit).then(function (data) {
      result = data;
    });

    // Act
    $httpBackend.flush();

    // Assert
    expect(result.Id).toBe(3);
  });

  it('remove deletes an audit', function () {
    // Arrange
    $httpBackend.expectDELETE(API_BASE + '/3').respond(204);

    var resolved = false;
    AuditService.remove(3).then(function () {
      resolved = true;
    });

    // Act
    $httpBackend.flush();

    // Assert
    expect(resolved).toBe(true);
  });
});
