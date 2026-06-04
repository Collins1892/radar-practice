using IncidentsApi.Data;
using Microsoft.EntityFrameworkCore;

public class EfIncidentRepository : IIncidentRepository
{
    private readonly IncidentsDbContext _db;

    public EfIncidentRepository(IncidentsDbContext db) => _db = db;

    public PagedIncidentsResult GetPaged(IncidentListQuery query)
    {
        var incidents = _db.Incidents.AsNoTracking().AsQueryable();

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
        _db.Incidents.AsNoTracking().FirstOrDefault(i => i.Id == id);

    public Incident Add(Incident incident)
    {
        _db.Incidents.Add(incident);
        _db.SaveChanges();
        return incident;
    }

    public Incident? Update(Incident incident)
    {
        var existing = _db.Incidents.Find(incident.Id);
        if (existing is null)
            return null;

        _db.Entry(existing).CurrentValues.SetValues(incident);
        _db.SaveChanges();
        return existing;
    }

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
                ? query.OrderByDescending(i => i.Severity)
                : query.OrderBy(i => i.Severity),
            "status" => sortDescending
                ? query.OrderByDescending(i => i.Status)
                : query.OrderBy(i => i.Status),
            "reporteddate" => sortDescending
                ? query.OrderByDescending(i => i.ReportedDate)
                : query.OrderBy(i => i.ReportedDate),
            _ => query,
        };
    }
}
