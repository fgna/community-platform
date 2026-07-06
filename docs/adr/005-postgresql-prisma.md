# ADR 005 — PostgreSQL with Prisma ORM

**Status**: Accepted

## Context

The platform requires a relational database with strong consistency guarantees, complex queries (aggregations for analytics, full-text search), and a TypeScript-native ORM that generates type-safe query builders from the schema.

## Decision

Use PostgreSQL 16 as the primary database and Prisma ORM for schema management, migrations, and query building.

## Consequences

**Benefits:**
- Prisma generates TypeScript types from the schema — type-safe queries without manual type definitions
- Schema-first migrations with a clear migration history (`prisma/migrations/`)
- `prisma migrate deploy` is safe for production (never resets data)
- `prisma generate` produces the client from the schema — consistent types across dev and CI
- Prisma Studio provides a visual DB browser for debugging
- PostgreSQL `@@unique` constraints enforce business rules at the DB level (e.g., one reaction per user per post per type)

**Trade-offs:**
- Prisma does not support `SELECT ... FOR UPDATE` natively — raw queries needed for transactions requiring row-level locks (used in billing, learning group join, etc.)
- Full-text search via Prisma `contains` is basic; dedicated search engines (Meilisearch, Elasticsearch) would perform better at scale
- Prisma client bundle size is larger than lighter ORMs like Drizzle

## Alternatives Considered

- **MySQL / MariaDB**: popular but fewer advanced features (window functions, advisory locks); PostgreSQL is a better fit for analytics queries
- **Drizzle ORM**: lighter, more SQL-native; less mature ecosystem and fewer migration tools at decision time
- **TypeORM**: more NestJS-native but verbose, more prone to N+1 queries without careful attention
- **MongoDB**: document model doesn't fit the relational data model well (foreign keys, unique constraints, joins)
