using System;
using System.Collections.Generic;
using System.Linq;
using AuditsApi.Models;

namespace AuditsApi.Repositories
{
    /// <summary>
    /// In-memory audit store. No interface — legacy pattern.
    /// </summary>
    public class AuditRepository
    {
        // Static store simulates persistence across requests in this legacy reference app.
        private static readonly List<Audit> _audits = SeedAudits();
        private static int _nextId = _audits.Max(a => a.Id) + 1;
        private static readonly object _syncRoot = new object();

        public AuditRepository()
        {
        }

        public virtual IList<Audit> GetAll()
        {
            lock (_syncRoot)
            {
                return _audits.OrderByDescending(a => a.AuditDate).ToList();
            }
        }

        public virtual Audit GetById(int id)
        {
            lock (_syncRoot)
            {
                return _audits.FirstOrDefault(a => a.Id == id);
            }
        }

        public virtual Audit Add(Audit audit)
        {
            lock (_syncRoot)
            {
                audit.Id = _nextId++;
                _audits.Add(audit);
                return audit;
            }
        }

        public virtual bool Update(Audit audit)
        {
            lock (_syncRoot)
            {
                var existing = GetById(audit.Id);
                if (existing == null)
                {
                    return false;
                }

                existing.Title = audit.Title;
                existing.Description = audit.Description;
                existing.AuditDate = audit.AuditDate;
                existing.Status = audit.Status;
                existing.CreatedBy = audit.CreatedBy;
                return true;
            }
        }

        public virtual bool Delete(int id)
        {
            lock (_syncRoot)
            {
                var existing = GetById(id);
                if (existing == null)
                {
                    return false;
                }

                return _audits.Remove(existing);
            }
        }

        private static List<Audit> SeedAudits()
        {
            return new List<Audit>
            {
                new Audit
                {
                    Id = 1,
                    Title = "Hand Hygiene Compliance — Ward 4B",
                    Description = "Quarterly observational audit of hand hygiene before and after patient contact.",
                    AuditDate = new DateTime(2026, 3, 12),
                    Status = "Completed",
                    CreatedBy = "quality.team"
                },
                new Audit
                {
                    Id = 2,
                    Title = "Medication Storage — Pharmacy Fridge",
                    Description = "Temperature log review and cold-chain storage checklist for refrigerated medicines.",
                    AuditDate = new DateTime(2026, 5, 20),
                    Status = "In Progress",
                    CreatedBy = "pharmacy.audit"
                },
                new Audit
                {
                    Id = 3,
                    Title = "Emergency Resuscitation Trolley Check",
                    Description = "Monthly verification of crash trolley contents, expiry dates, and seal integrity.",
                    AuditDate = new DateTime(2026, 6, 1),
                    Status = "Scheduled",
                    CreatedBy = "clinical.safety"
                },
                new Audit
                {
                    Id = 4,
                    Title = "Infection Control Walkthrough — Outpatients",
                    Description = "Environmental cleanliness and PPE availability assessment in waiting areas.",
                    AuditDate = new DateTime(2026, 2, 8),
                    Status = "Cancelled",
                    CreatedBy = "ipc.lead"
                }
            };
        }
    }
}