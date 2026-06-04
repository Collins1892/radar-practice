namespace IncidentsApi;

public record IncidentRequest(
    string Title,
    string Description,
    string Location,
    IncidentSeverity Severity,
    IncidentStatus Status,
    DateTime ReportedDate);
