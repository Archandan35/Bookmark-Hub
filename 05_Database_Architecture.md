# Database Architecture

UI → Services → Repository → Provider → Supabase.

Providers must be swappable (Firebase, MongoDB, PostgreSQL, REST,
GraphQL) without UI changes.
