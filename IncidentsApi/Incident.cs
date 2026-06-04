namespace IncidentsApi;

public enum IncidentSeverity
{
    Low,
    Medium,
    High,
    Critical,
}

public enum IncidentStatus
{
    Open,
    InProgress,
    Resolved,
    Closed,
}

public record Incident(
    int Id,
    string Title,
    string Description,
    string Location,
    IncidentSeverity Severity,
    IncidentStatus Status,
    DateTime ReportedDate);
