using System;
using System.Linq;
using AuditsApi.Models;
using AuditsApi.Repositories;
using NUnit.Framework;

namespace AuditsApi.Tests
{
    // Static backing store is shared across repository instances — test execution order can affect results (legacy constraint).
    [TestFixture]
    public class AuditRepositoryTests
    {
        private AuditRepository _repository;

        [SetUp]
        public void SetUp()
        {
            // Arrange — fresh repository with seeded data
            _repository = new AuditRepository();
        }

        [Test]
        public void GetAll_ReturnsSeededAudits_OrderedByAuditDateDescending()
        {
            // Act
            var audits = _repository.GetAll();

            // Assert
            Assert.IsNotNull(audits);
            Assert.GreaterOrEqual(audits.Count, 4);
            Assert.AreEqual("Scheduled", audits.First().Status);
        }

        [Test]
        public void GetById_ExistingId_ReturnsAudit()
        {
            // Arrange
            const int existingId = 1;

            // Act
            Audit audit = _repository.GetById(existingId);

            // Assert
            Assert.IsNotNull(audit);
            Assert.AreEqual(existingId, audit.Id);
            Assert.AreEqual("Hand Hygiene Compliance — Ward 4B", audit.Title);
        }

        [Test]
        public void GetById_UnknownId_ReturnsNull()
        {
            // Act
            Audit audit = _repository.GetById(9999);

            // Assert
            Assert.IsNull(audit);
        }

        [Test]
        public void Add_NewAudit_AssignsIdAndPersists()
        {
            // Arrange
            var newAudit = new Audit
            {
                Title = "Falls Risk Assessment Spot Check",
                Description = "Sample audit for testing.",
                AuditDate = new DateTime(2026, 6, 15),
                Status = "Scheduled",
                CreatedBy = "test.user"
            };

            // Act
            Audit created = _repository.Add(newAudit);

            // Assert
            Assert.Greater(created.Id, 0);
            Assert.AreEqual(created.Id, _repository.GetById(created.Id).Id);
        }

        [Test]
        public void Update_ExistingAudit_ModifiesFields()
        {
            // Arrange
            Audit audit = _repository.GetById(3);
            audit.Status = "In Progress";
            audit.Title = "Emergency Resuscitation Trolley Check — Updated";

            // Act
            bool updated = _repository.Update(audit);

            // Assert
            Assert.IsTrue(updated);
            Assert.AreEqual("In Progress", _repository.GetById(3).Status);
        }

        [Test]
        public void Delete_ExistingAudit_RemovesFromStore()
        {
            // Arrange
            const int idToDelete = 4;

            // Act
            bool deleted = _repository.Delete(idToDelete);

            // Assert
            Assert.IsTrue(deleted);
            Assert.IsNull(_repository.GetById(idToDelete));
        }
    }
}

