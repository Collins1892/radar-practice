namespace AuditsApi.Models;

/// <summary>
/// Represents a clinical quality audit record.
/// </summary>
public class Audit
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime AuditDate { get; set; }
    public Status Status { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public RecordStatus RecordStatus { get; set; } = RecordStatus.Active;
}
