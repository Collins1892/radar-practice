using AuditsApi.Models;

namespace AuditsApi;

public record AuditResponse(
    int Id,
    string Title,
    string Description,
    DateTime AuditDate,
    Status Status,
    string CreatedBy);

public record PagedAuditsResponse(
    IReadOnlyList<AuditResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public static class AuditMappings
{
    public static AuditResponse ToResponse(this Audit audit) =>
        new(audit.Id, audit.Title, audit.Description, audit.AuditDate, audit.Status, audit.CreatedBy);
}
