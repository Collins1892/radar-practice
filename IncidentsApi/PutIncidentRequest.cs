namespace IncidentsApi;

public record PutIncidentRequest(
    int Id,
    string Title,
    string Description,
    string Location,
    IncidentSeverity Severity,
    IncidentStatus Status,
    DateTime ReportedDate);
