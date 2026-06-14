-- Talli MVP Supabase/Postgres workspace schema.
-- Source of truth: ../../supabase/migrations/0001_authenticated_workspace.sql
--
-- Security decisions:
-- - RLS enabled on every exposed public table.
-- - Policies use `to authenticated` plus ownership/membership predicates.
-- - Authorization uses company memberships, not user-editable metadata.
-- - Explicit grants are included because Supabase Data API exposure may require them.

\i ../../supabase/migrations/0001_authenticated_workspace.sql
