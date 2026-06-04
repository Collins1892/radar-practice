namespace IncidentsApi;

public record PagedIncidentsResult(
    IReadOnlyList<Incident> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);
