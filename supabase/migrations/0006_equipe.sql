-- =====================================================================
-- ServiLink : comptes de l'équipe (28/11/2026)
-- Chaque collaborateur crée son compte lui-même avec son e-mail personnel (code reçu par e-mail, sans mot de passe).
-- L'administrateur l'ajoute ensuite à l'équipe avec un rôle, depuis /admin/equipe. Aucune clé secrète n'est nécessaire.
-- Premier administrateur : voir le guide (une ligne SQL à exécuter une seule fois dans Supabase).
-- =====================================================================

-- Liste de l'équipe avec l'e-mail de chacun (réservée aux administrateurs)
create or replace function public.liste_equipe()
returns table (user_id uuid, nom text, email text, role role_equipe, actif boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.a_role('admin') then raise exception 'reserve_admin' using errcode = '42501'; end if;
  return query select e.user_id, e.nom, u.email::text, e.role, e.actif, e.created_at
    from equipe e join auth.users u on u.id = e.user_id order by e.actif desc, e.nom;
end $$;

-- Ajouter (ou réactiver, ou changer le rôle de) un collaborateur qui a déjà créé son compte
create or replace function public.ajouter_membre(p_email text, p_nom text, p_role role_equipe)
returns uuid language plpgsql volatile security definer set search_path = public, auth as $$
declare v_id uuid;
begin
  if not public.a_role('admin') then raise exception 'reserve_admin' using errcode = '42501'; end if;
  if char_length(coalesce(trim(p_nom), '')) not between 2 and 80 then raise exception 'nom_invalide' using errcode = 'P0001'; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_id is null then raise exception 'compte_introuvable' using errcode = 'P0001'; end if;
  insert into equipe (user_id, nom, role, actif) values (v_id, trim(p_nom), p_role, true)
  on conflict (user_id) do update set nom = excluded.nom, role = excluded.role, actif = true;
  return v_id;
end $$;

-- Retirer un collaborateur (il garde son compte client, perd l'accès au back-office). On ne se retire pas soi-même.
create or replace function public.retirer_membre(p_user uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.a_role('admin') then raise exception 'reserve_admin' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'pas_soi_meme' using errcode = 'P0001'; end if;
  update equipe set actif = false where user_id = p_user;
end $$;

revoke all on function public.liste_equipe(), public.ajouter_membre(text, text, role_equipe), public.retirer_membre(uuid) from public, anon;
grant execute on function public.liste_equipe(), public.ajouter_membre(text, text, role_equipe), public.retirer_membre(uuid) to authenticated;
