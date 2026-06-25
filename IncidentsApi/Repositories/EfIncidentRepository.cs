using IncidentsApi.Data;
using Microsoft.EntityFrameworkCore;

namespace IncidentsApi;

public class EfIncidentRepository : IIncidentRepository
{
    private static readonly HashSet<string> SortableFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "title",
        "description",
        "location",
        "severity",
        "status",
        "reporteddate",
    };

    private readonly IncidentsDbContext _db;

    public EfIncidentRepository(IncidentsDbContext db) => _db = db;

    public PagedIncidentsResult GetPaged(IncidentListQuery query)
    {
        var incidents = _db.Incidents.AsNoTracking()
            .Where(i => i.RecordStatus == RecordStatus.Active);

        if (query.Severity is not null)
            incidents = incidents.Where(i => i.Severity == query.Severity);

        if (query.Status is not null)
            incidents = incidents.Where(i => i.Status == query.Status);

        var totalCount = incidents.Count();

        incidents = ApplySort(incidents, query.SortBy, query.SortDescending);

        var items = incidents
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToList();

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)query.PageSize);

        return new PagedIncidentsResult(items, query.Page, query.PageSize, totalCount, totalPages);
    }

    public Incident? GetById(int id) =>
        _db.Incidents.AsNoTracking()
            .FirstOrDefault(i => i.Id == id && i.RecordStatus == RecordStatus.Active);

    public Incident Add(Incident incident)
    {
        incident.RecordStatus = RecordStatus.Active;
        _db.Incidents.Add(incident);
        _db.SaveChanges();
        return incident;
    }

    public Incident? Update(Incident incident)
    {
        var existing = _db.Incidents.FirstOrDefault(
            i => i.Id == incident.Id && i.RecordStatus == RecordStatus.Active);
        if (existing is null)
            return null;

        existing.Title = incident.Title;
        existing.Description = incident.Description;
        existing.Location = incident.Location;
        existing.Severity = incident.Severity;
        existing.Status = incident.Status;
        existing.ReportedDate = incident.ReportedDate;

        _db.SaveChanges();
        return existing;
    }

    public bool SoftDelete(int id)
    {
        var existing = _db.Incidents.FirstOrDefault(
            i => i.Id == id && i.RecordStatus == RecordStatus.Active);
        if (existing is null)
            return false;

        existing.RecordStatus = RecordStatus.Deleted;
        _db.SaveChanges();
        return true;
    }

    public bool IsValidSortField(string sortField) =>
        SortableFields.Contains(sortField);

    private static IQueryable<Incident> ApplySort(
        IQueryable<Incident> query,
        string sortBy,
        bool sortDescending)
    {
        return sortBy.ToLowerInvariant() switch
        {
            "title" => sortDescending
                ? query.OrderByDescending(i => i.Title)
                : query.OrderBy(i => i.Title),
            "description" => sortDescending
                ? query.OrderByDescending(i => i.Description)
                : query.OrderBy(i => i.Description),
            "location" => sortDescending
                ? query.OrderByDescending(i => i.Location)
                : query.OrderBy(i => i.Location),
            "severity" => sortDescending
                ? query.OrderByDescending(i => (int)i.Severity)
                : query.OrderBy(i => (int)i.Severity),
            "status" => sortDescending
                ? query.OrderByDescending(i => (int)i.Status)
                : query.OrderBy(i => (int)i.Status),
            "reporteddate" => sortDescending
                ? query.OrderByDescending(i => i.ReportedDate)
                : query.OrderBy(i => i.ReportedDate),
            _ => query.OrderByDescending(i => i.ReportedDate),
        };
    }
}
