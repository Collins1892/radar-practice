using AuditsApi.Models;

namespace AuditsApi;

public static class AuditMappings
{
    public static AuditResponse ToResponse(this Audit audit) =>
        new(audit.Id, audit.Title, audit.Description, audit.AuditDate, audit.Status, audit.CreatedBy);
}
