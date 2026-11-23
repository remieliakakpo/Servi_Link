-- Reproduit le minimum de Supabase pour tester les migrations sur un PostgreSQL nu :
-- rôles anon / authenticated, schéma auth, auth.uid() lu dans un réglage de session.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase donne par défaut ces droits à authenticated ; la RLS fait le tri.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
