namespace AuditsApi;

public record AuditRequest(
    string Title,
    string Description,
    DateTime AuditDate,
    Models.Status? Status,
    string CreatedBy,
    // Only meaningful for PUT; ignored on POST.
    int Id = 0);
