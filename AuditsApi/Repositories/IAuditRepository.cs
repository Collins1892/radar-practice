using AuditsApi.Models;

namespace AuditsApi.Repositories;

public interface IAuditRepository
{
    PagedAuditsResult GetAll(AuditListQuery query);
    Audit? GetById(int id);
    Audit Add(Audit audit);
    Audit? Update(Audit audit);
    bool SoftDelete(int id);
    bool IsValidSortField(string sortField);
}
