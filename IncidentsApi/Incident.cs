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

/// <summary>
/// Represents an incident report record.
/// </summary>
public class Incident
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public IncidentSeverity Severity { get; set; }
    public IncidentStatus Status { get; set; }
    public DateTime ReportedDate { get; set; }
    public RecordStatus RecordStatus { get; set; } = RecordStatus.Active;
}
