namespace IncidentsApi;

/// <summary>
/// Soft-delete marker. Strong candidate for extraction into a shared library
/// for reuse across ItemsApi and AuditsApi; kept local to IncidentsApi for this migration scope.
/// </summary>
public enum RecordStatus
{
    Active = 0,
    Deleted = 1,
}
