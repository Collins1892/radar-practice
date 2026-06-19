namespace AuditsApi;

public record AuditRequest(
    string Title,
    string Description,
    DateTime AuditDate,
    Models.Status? Status,
    string CreatedBy,
    int Id = 0);
