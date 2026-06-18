using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using AuditsApi.Models;
using AuditsApi.Repositories;

namespace AuditsApi
{
    [RoutePrefix("api/audits")]
    public class AuditsController : ApiController
    {
        private readonly AuditRepository _repository;

        public AuditsController()
            : this(new AuditRepository())
        {
        }

        public AuditsController(AuditRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [Route("")]
        public HttpResponseMessage GetAll()
        {
            IList<Audit> audits = _repository.GetAll();
            return Request.CreateResponse(HttpStatusCode.OK, audits);
        }

        [HttpGet]
        [Route("{id:int}")]
        public HttpResponseMessage GetById(int id)
        {
            Audit audit = _repository.GetById(id);
            if (audit == null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound,
                    string.Format("Audit with id {0} was not found.", id));
            }

            return Request.CreateResponse(HttpStatusCode.OK, audit);
        }

        [HttpPost]
        [Route("")]
        public HttpResponseMessage Create([FromBody] Audit audit)
        {
            string validationError = ValidateAudit(audit, isUpdate: false);
            if (validationError != null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, validationError);
            }

            Audit created = _repository.Add(audit);
            return Request.CreateResponse(HttpStatusCode.Created, created);
        }

        [HttpPut]
        [Route("{id:int}")]
        public HttpResponseMessage Update(int id, [FromBody] Audit audit)
        {
            if (audit == null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Audit payload is required.");
            }

            if (id != audit.Id)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest,
                    "Route id does not match audit id.");
            }

            string validationError = ValidateAudit(audit, isUpdate: true);
            if (validationError != null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, validationError);
            }

            if (_repository.GetById(id) == null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound,
                    string.Format("Audit with id {0} was not found.", id));
            }

            _repository.Update(audit);
            return Request.CreateResponse(HttpStatusCode.OK, audit);
        }

        [HttpDelete]
        [Route("{id:int}")]
        public HttpResponseMessage Delete(int id)
        {
            if (!_repository.Delete(id))
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound,
                    string.Format("Audit with id {0} was not found.", id));
            }

            return Request.CreateResponse(HttpStatusCode.NoContent);
        }

        private static string ValidateAudit(Audit audit, bool isUpdate)
        {
            if (audit == null)
            {
                return "Audit payload is required.";
            }

            if (isUpdate && audit.Id <= 0)
            {
                return "A valid audit id is required.";
            }

            if (string.IsNullOrWhiteSpace(audit.Title))
            {
                return "Title is required.";
            }

            if (audit.Title.Length > 200)
            {
                return "Title must not exceed 200 characters.";
            }

            if (string.IsNullOrWhiteSpace(audit.Status))
            {
                return "Status is required.";
            }

            var allowedStatuses = new[] { "Scheduled", "In Progress", "Completed", "Cancelled" };
            if (Array.IndexOf(allowedStatuses, audit.Status) < 0)
            {
                return "Status must be one of: Scheduled, In Progress, Completed, Cancelled.";
            }

            if (audit.AuditDate == default(DateTime))
            {
                return "AuditDate is required.";
            }

            if (string.IsNullOrWhiteSpace(audit.CreatedBy))
            {
                return "CreatedBy is required.";
            }

            return null;
        }
    }
}
