namespace AuditsApi.Models;

/// <summary>
/// Soft-delete marker. Strong candidate for extraction into a shared library
/// for reuse across ItemsApi and IncidentsApi; kept local to AuditsApi for this migration scope.
/// </summary>
public enum RecordStatus
{
    Active = 0,
    Deleted = 1,
}
