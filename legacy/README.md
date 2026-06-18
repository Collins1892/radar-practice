# Legacy Audits module

Reference-only **before-state** for a modernisation migration (.NET 4 Web API + AngularJS 1.6 → .NET 8 minimal API + React). This tree is not a buildable application; it exists to document domain behaviour, API contracts, and UI patterns that the modern stack will replace.

**AngularJS 1.6** reached end-of-life in **December 2021**. The client loads Angular and `angular-route` from CDN script tags that are unpinned intentionally for this static reference snapshot (no package manager lockfile or Subresource Integrity hashes in the tree).

Do not edit this folder during migration work; port behaviour into the modern projects instead.
