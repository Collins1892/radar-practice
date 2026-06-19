using AuditsApi.Models;

namespace AuditsApi;

public record AuditListQuery(
    Status? Status,
    string SortBy,
    bool SortDescending,
    int Page,
    int PageSize);
