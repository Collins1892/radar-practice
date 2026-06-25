namespace IncidentsApi;

public static class IncidentMappings
{
    public static IncidentResponse ToResponse(this Incident incident) =>
        new(
            incident.Id,
            incident.Title,
            incident.Description,
            incident.Location,
            incident.Severity,
            incident.Status,
            incident.ReportedDate);
}
