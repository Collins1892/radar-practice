public interface IIncidentRepository
{
    PagedIncidentsResult GetPaged(IncidentListQuery query);
    Incident? GetById(int id);
    Incident Add(Incident incident);
    Incident? Update(Incident incident);
}
