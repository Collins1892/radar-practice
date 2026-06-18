using System;

namespace AuditsApi.Models
{
    /// <summary>
    /// Represents a clinical quality audit record.
    /// </summary>
    public class Audit
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime AuditDate { get; set; }
        public string Status { get; set; }
        public string CreatedBy { get; set; }
    }
}
