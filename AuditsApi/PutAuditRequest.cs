namespace AuditsApi;

public record PutAuditRequest(
    int Id,
    string Title,
    string Description,
    DateTime AuditDate,
    Models.Status? Status,
    string CreatedBy);
