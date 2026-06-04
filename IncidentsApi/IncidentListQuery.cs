namespace IncidentsApi;

public record IncidentListQuery(
    IncidentSeverity? Severity,
    IncidentStatus? Status,
    string SortBy,
    bool SortDescending,
    int Page,
    int PageSize);
