-- =====================================================================
-- ServiLink : protections anti-abus des fonctions ouvertes à tous (28/11/2026)
-- compter() et enregistrer_calcul() sont appelables sans compte : on borne ce qu'un robot peut écrire.
-- =====================================================================

-- Compteurs : au plus 20 000 lignes par jour (les cibles inventées au-delà sont ignorées, les vraies continuent de compter)
create or replace function public.compter(p_type text, p_cible text default '')
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_cible text := coalesce(left(p_cible, 64), '');
begin
  if not exists (select 1 from evenements where jour = current_date and type = p_type and cible = v_cible)
     and (select count(*) from evenements where jour = current_date) >= 20000 then
    return;
  end if;
  insert into evenements (jour, type, cible, nombre) values (current_date, p_type, v_cible, 1)
  on conflict (jour, type, cible) do update set nombre = evenements.nombre + 1;
end $$;

-- Calculs partagés : ouvrages connus seulement, et au plus 3 000 par heure pour tout le site
create or replace function public.verifier_calcul() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.type_ouvrage not in ('mur_cloture', 'piece', 'dalle', 'fondation', 'poteaux', 'chainage', 'dallage', 'chape', 'enduit', 'carrelage', 'peinture', 'paves') then
    raise exception 'ouvrage_inconnu' using errcode = 'P0001';
  end if;
  if (select count(*) from calculs where created_at > now() - interval '1 hour') >= 3000 then
    raise exception 'trop_de_calculs' using errcode = 'P0001', hint = 'Réessayez dans quelques minutes.';
  end if;
  return new;
end $$;
drop trigger if exists calculs_verification on calculs;
create trigger calculs_verification before insert on calculs for each row execute function public.verifier_calcul();
create index if not exists calculs_date on calculs (created_at desc);
