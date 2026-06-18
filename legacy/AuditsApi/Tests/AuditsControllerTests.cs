using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using AuditsApi.Models;
using AuditsApi.Repositories;
using Moq;
using NUnit.Framework;

namespace AuditsApi.Tests
{
    [TestFixture]
    public class AuditsControllerTests
    {
        private Mock<AuditRepository> _repositoryMock;
        private AuditsController _controller;

        [SetUp]
        public void SetUp()
        {
            // Arrange
            _repositoryMock = new Mock<AuditRepository> { CallBase = false };
            _controller = new AuditsController(_repositoryMock.Object);
            _controller.Request = new HttpRequestMessage();
            _controller.Configuration = new System.Web.Http.HttpConfiguration();
        }

        [Test]
        public void GetAll_ReturnsOkWithAudits()
        {
            // Arrange
            var audits = new List<Audit>
            {
                new Audit { Id = 1, Title = "Test Audit", Status = "Scheduled",
                    AuditDate = DateTime.Today, CreatedBy = "test.user" }
            };
            _repositoryMock.Setup(r => r.GetAll()).Returns(audits);

            // Act
            HttpResponseMessage response = _controller.GetAll();

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        }

        [Test]
        public void GetById_NotFound_Returns404()
        {
            // Arrange
            _repositoryMock.Setup(r => r.GetById(42)).Returns((Audit)null);

            // Act
            HttpResponseMessage response = _controller.GetById(42);

            // Assert
            Assert.AreEqual(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Test]
        public void Create_InvalidStatus_ReturnsBadRequest()
        {
            // Arrange
            var audit = new Audit
            {
                Title = "Invalid Status Audit",
                Description = "Should fail validation.",
                AuditDate = DateTime.Today,
                Status = "Unknown",
                CreatedBy = "test.user"
            };

            // Act
            HttpResponseMessage response = _controller.Create(audit);

            // Assert
            Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Test]
        public void Create_ValidAudit_ReturnsCreated()
        {
            // Arrange
            var audit = new Audit
            {
                Title = "Pressure Ulcer Prevention Review",
                Description = "Quarterly skin integrity audit.",
                AuditDate = DateTime.Today,
                Status = "Scheduled",
                CreatedBy = "test.user"
            };
            _repositoryMock.Setup(r => r.Add(It.IsAny<Audit>()))
                .Returns((Audit a) => { a.Id = 10; return a; });

            // Act
            HttpResponseMessage response = _controller.Create(audit);

            // Assert
            Assert.AreEqual(HttpStatusCode.Created, response.StatusCode);
        }

        [Test]
        public void Delete_NotFound_Returns404()
        {
            // Arrange
            _repositoryMock.Setup(r => r.Delete(99)).Returns(false);

            // Act
            HttpResponseMessage response = _controller.Delete(99);

            // Assert
            Assert.AreEqual(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
