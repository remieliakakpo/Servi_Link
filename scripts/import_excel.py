"""Convertit annuaire_lome_collecte.xlsx en SQL (upsert) pour Supabase.

Usage : python3 import_excel.py annuaire_lome_collecte.xlsx > import.sql
Puis coller import.sql dans l'éditeur SQL de Supabase (ou psql).
Les lignes sans nom sont ignorées, ainsi que les lignes "(exemple)".
Le schéma (supabase/migrations) et seed.sql doivent avoir été appliqués avant.
Les fiches importées au statut Retenu sont publiées directement : l'import est fait par
l'administrateur depuis l'éditeur SQL (hors contrôle « seul l'admin publie » de l'appli).
"""
import sys
import datetime as dt
import unicodedata
import openpyxl

COLS = {  # colonne Excel (Annuaire) -> champ SQL
    "B": "nom", "C": "type", "D": "metier", "E": "quartier", "F": "telephone",
    "G": "whatsapp", "H": "source", "I": "date_premier_contact", "J": "statut",
    "K": "piece_identite", "L": "carte_artisan_rccm", "M": "atelier_visite",
    "N": "chantier_ref_1", "O": "chantier_ref_2", "P": "chantier_ref_3",
    "Q": "nb_chantiers_vus", "R": "photos_lien", "S": "nb_clients_appeles",
    "T": "avis_clients", "V": "charte_signee", "W": "ajoute_whatsapp",
    "X": "date_verification", "Z": "verifie_par", "AA": "remarques",
    "AB": "domaine", "AC": "ville", "AD": "axe", "AE": "point_repere",
    "AF": "latitude", "AG": "longitude", "AI": "rayon_km", "AJ": "depannage_route",
    "AK": "service_domicile", "AL": "horaires", "AM": "urgences_nuit",
}
TARIFS = {"D": "service", "E": "unite", "F": "prix_min", "G": "prix_max",
          "H": "frais_deplacement", "I": "date_releve", "J": "source_prix", "K": "remarques"}
NOTES = {"C": "qualite_travail", "D": "respect_delais", "E": "avis_clients",
         "F": "clarte_prix", "G": "reactivite", "K": "commentaire"}


# Métier de l'Excel (liste déroulante de la feuille « Listes ») -> slug de la table metiers (grille BTP).
# Les métiers du volet services (mécanicien, vulcanisateur…) n'ont pas de slug en V1 : ils sont
# importés mais n'apparaissent pas dans la grille BTP.
METIERS_BTP = {
    "macon": "macon", "ferrailleur": "ferrailleur", "coffreur": "coffreur",
    "electricien batiment": "electricien", "plombier": "plombier", "carreleur": "carreleur",
    "menuisier": "menuisier", "soudeur": "soudeur", "peintre": "peintre",
    "ciment": "ciment", "fer a beton": "fer-a-beton", "sable gravier": "sable-gravier",
    "quincaillerie": "quincaillerie", "carreaux sanitaires": "carreaux-sanitaires", "bois": "bois",
    "agglos": "agglos", "briqueterie": "agglos",
    # Métiers ajoutés avec la collecte Google Maps du 19/11/2026
    "couvreur toiture": "toiture", "decoration interieure": "decoration", "architecte": "architecte",
    "materiaux de construction": "materiaux", "mecanicien auto": "mecanicien",
}


def sans_accents(t):
    t = unicodedata.normalize("NFD", str(t)).encode("ascii", "ignore").decode().lower()
    return " ".join("".join(c if c.isalnum() else " " for c in t).split())


def metier_slug(metier):
    if not metier:
        return None
    n = sans_accents(metier)
    if n in METIERS_BTP:
        return METIERS_BTP[n]
    # Texte libre (« Fer à béton, ciment ») : on prend le premier métier cité dans le texte
    trouves = [(f" {n} ".find(f" {cle} "), slug) for cle, slug in METIERS_BTP.items() if f" {cle} " in f" {n} "]
    return min(trouves)[1] if trouves else None


def sql(v):
    if v is None or (isinstance(v, str) and not v.strip()):
        return "null"
    if isinstance(v, (dt.datetime, dt.date)):
        return f"'{v:%Y-%m-%d}'"
    if isinstance(v, bool):
        return "null"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        return repr(round(v, 6))
    return "'" + str(v).strip().replace("'", "''") + "'"


def tel(v):
    """Normalise en +228 XX XX XX XX quand c'est un numéro togolais à 8 chiffres."""
    if v is None:
        return None
    d = "".join(c for c in str(v) if c.isdigit())
    if d.startswith("00"):
        d = d[2:]
    if d.startswith("228"):
        d = d[3:]
    if len(d) == 8:
        return f"+228 {d[0:2]} {d[2:4]} {d[4:6]} {d[6:8]}"
    return str(v).strip()


def upsert(table, key, row):
    cols = ", ".join(row)
    vals = ", ".join(sql(v) for v in row.values())
    keys = {k.strip() for k in key.split(",")}
    upd = ", ".join(f"{c} = excluded.{c}" for c in row if c not in keys)
    return f"insert into {table} ({cols}) values ({vals}) on conflict ({key}) do update set {upd};"


def main(path):
    wb = openpyxl.load_workbook(path, data_only=False)
    ws = wb["Annuaire"]
    ids = set()
    out = ["begin;"]
    for r in range(2, ws.max_row + 1):
        nom = ws[f"B{r}"].value
        if not nom or "(exemple)" in str(nom):
            continue
        row = {"id": f"ID-{r - 1:03d}"}  # même règle que la formule de la colonne A
        for col, champ in COLS.items():
            v = ws[f"{col}{r}"].value
            if champ in ("telephone", "whatsapp"):
                v = tel(v)
            row[champ] = v
        if not row["statut"]:
            row["statut"] = "À appeler"
        if not row["domaine"]:
            row["domaine"] = "BTP"
        row["metier_slug"] = metier_slug(row["metier"])
        if row["domaine"] == "BTP" and not row["metier_slug"]:
            print(f"-- attention : métier « {row['metier']} » ({row['id']}) hors de la grille BTP", file=sys.stderr)
        ids.add(row["id"])
        out.append(upsert("professionnels", "id", row))

    ws = wb["Notation"]
    for r in range(2, ws.max_row + 1):
        pid = ws[f"A{r}"].value
        if not pid or pid not in ids:
            continue
        row = {"professionnel_id": pid}
        row.update({champ: ws[f"{col}{r}"].value for col, champ in NOTES.items()})
        out.append(upsert("notations", "professionnel_id", row))
    if "Tarifs" in wb.sheetnames:
        ws = wb["Tarifs"]
        for r in range(2, ws.max_row + 1):
            pid, svc = ws[f"A{r}"].value, ws[f"D{r}"].value
            if not pid or pid not in ids or not svc:
                continue
            row = {"professionnel_id": pid}
            row.update({champ: ws[f"{col}{r}"].value for col, champ in TARIFS.items()})
            out.append(upsert("tarifs", "professionnel_id, service", row))
    out.append("commit;")
    print("\n".join(out))
    print(f"-- {len(ids)} professionnels importés", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
