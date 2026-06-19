using AuditsApi.Models;

namespace AuditsApi;

public record PagedAuditsResult(
    IReadOnlyList<Audit> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);
