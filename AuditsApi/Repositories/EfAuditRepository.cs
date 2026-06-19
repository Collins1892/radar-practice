using AuditsApi.Data;
using AuditsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AuditsApi.Repositories;

public class EfAuditRepository : IAuditRepository
{
    private static readonly HashSet<string> SortableFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "title",
        "description",
        "auditdate",
        "status",
        "createdby",
    };

    private readonly AuditsDbContext _db;

    public EfAuditRepository(AuditsDbContext db) => _db = db;

    public PagedAuditsResult GetAll(AuditListQuery query)
    {
        var audits = _db.Audits.AsNoTracking()
            .Where(a => a.RecordStatus == RecordStatus.Active)
            .AsQueryable();

        if (query.Status is not null)
            audits = audits.Where(a => a.Status == query.Status);

        var totalCount = audits.Count();

        var sorted = ApplySort(audits, query.SortBy, query.SortDescending);

        var items = sorted
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToList();

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)query.PageSize);

        return new PagedAuditsResult(items, query.Page, query.PageSize, totalCount, totalPages);
    }

    public Audit? GetById(int id) =>
        _db.Audits.AsNoTracking()
            .FirstOrDefault(a => a.Id == id && a.RecordStatus == RecordStatus.Active);

    public Audit Add(Audit audit)
    {
        audit.RecordStatus = RecordStatus.Active;
        _db.Audits.Add(audit);
        _db.SaveChanges();
        return audit;
    }

    public Audit? Update(Audit audit)
    {
        var existing = _db.Audits.FirstOrDefault(
            a => a.Id == audit.Id && a.RecordStatus == RecordStatus.Active);
        if (existing is null)
            return null;

        existing.Title = audit.Title;
        existing.Description = audit.Description;
        existing.AuditDate = audit.AuditDate;
        existing.Status = audit.Status;
        existing.CreatedBy = audit.CreatedBy;

        _db.SaveChanges();
        return existing;
    }

    public bool SoftDelete(int id)
    {
        var existing = _db.Audits.FirstOrDefault(
            a => a.Id == id && a.RecordStatus == RecordStatus.Active);
        if (existing is null)
            return false;

        existing.RecordStatus = RecordStatus.Deleted;
        _db.SaveChanges();
        return true;
    }

    public bool IsValidSortField(string sortField) =>
        SortableFields.Contains(sortField);

    private static IQueryable<Audit> ApplySort(
        IQueryable<Audit> query,
        string sortBy,
        bool sortDescending)
    {
        return sortBy.ToLowerInvariant() switch
        {
            "title" => sortDescending
                ? query.OrderByDescending(a => a.Title)
                : query.OrderBy(a => a.Title),
            "description" => sortDescending
                ? query.OrderByDescending(a => a.Description)
                : query.OrderBy(a => a.Description),
            "auditdate" => sortDescending
                ? query.OrderByDescending(a => a.AuditDate)
                : query.OrderBy(a => a.AuditDate),
            "status" => sortDescending
                ? query.OrderByDescending(a => (int)a.Status)
                : query.OrderBy(a => (int)a.Status),
            "createdby" => sortDescending
                ? query.OrderByDescending(a => a.CreatedBy)
                : query.OrderBy(a => a.CreatedBy),
            _ => query.OrderByDescending(a => a.AuditDate),
        };
    }
}
