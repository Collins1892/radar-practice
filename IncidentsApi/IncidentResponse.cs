namespace IncidentsApi;

public record IncidentResponse(
    int Id,
    string Title,
    string Description,
    string Location,
    IncidentSeverity Severity,
    IncidentStatus Status,
    DateTime ReportedDate);

public record PagedIncidentsResponse(
    IReadOnlyList<IncidentResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);
