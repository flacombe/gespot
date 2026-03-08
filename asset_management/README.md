# Utilitaires pour l'asset management

La maintenance des réseaux aériens nécessite une gestion patrimoniale rigoureuse mais une description raisonable des lignes et des poteaux.  
Ce répertoire contient des utilitaires permettant de faciliter le rapportage à partir des données que présente gespot.fr

## Traitement des données RTE

### Fichier pylônes

Les pylônes ne sont pas distingués entre support de ligne et extrémités.  
Dans QGis, on peut qualifier les supports d'extrémités dans les postes à l'aide de :

```
if(regexp_match("numero_pylo", 'JA|ATT|BIS|bis') = 0 and ((strpos("code_ligne" ,"numero_pylo") > 0 and regexp_match("numero_pylo", '[A-Z0-9.]{4,}') > 0) or (regexp_match("numero_pylo", '[A-Z0-9_ .]{6,}') > 0)), 1, 0)
```

## Imports overpass

En attente de la solution du soucis d'arrondi d'imposm3, on importe des geojson issus d'overpass à l'aide d'ogr2ogr :

```
/* Lignes :*/
area["wikidata"="Q212429"]->.france;

way(area.france)["power"="line"]["operator"="RTE"]["voltage"~"(^|;)400000(;|$)"][!"line"];

out geom;

/* Pylônes */
area["wikidata"="Q212429"]->.france;

(
  way(area.france)["power"="line"]["operator"="RTE"]["voltage"~"(^|;)400000(;|$)"][!"line"];
  >;
)->.towers;
  
node.towers["power"="tower"];

out geom;

/* Circuits */
area["wikidata"="Q212429"]->.france;

relation(area.france)["route"="power"]["operator"="RTE"]["voltage"="400000"];

out geom;
```

```sh
ogr2ogr -f "PostgreSQL" PG:"host=127.0.0.1 port=5432 dbname=osm user=<user> password=<password>" /tmp/lines.geojson -nln public.power_lines400kv -lco GEOMETRY_NAME=geometry -overwrite
ogr2ogr -f "PostgreSQL" PG:"host=127.0.0.1 port=5432 dbname=osm user=<user> password=<password>" /tmp/towers.geojson -nln public.power_towers400kv -lco GEOMETRY_NAME=geometry -overwrite
ogr2ogr -f "PostgreSQL" PG:"host=127.0.0.1 port=5432 dbname=osm user=<user> password=<password>" /tmp/circuits.geojson -nln public.power_rel400kv -lco GEOMETRY_NAME=geometry -overwrite
```

## production des KPI

```sh
psql -d postgres://127.0.0.1:5432/osm -U <user> -c "COPY (select count(*) as nb, t.\"design:ref\", c.\"ref:fr:rte\"
from power_circuits c
join power_towers400kv t on ST_intersects(t.geometry, c.geometry)
group by c.\"ref:fr:rte\", t.\"design:ref\"
order by c.\"ref:fr:rte\", t.\"design:ref\") TO STDOUT with CSV header;" > /tmp/cantons.csv
```

```sh
psql -d postgres://127.0.0.1:5432/osm -U <user> -c "COPY (select \"design:ref\" as design,
line_attachment as la,
count(*) as nb
from power_towers400kv
where \"design:ref\" IN ('A1', 'A2', 'B1', 'F44', 'F88', 'L1', 'T5')
group by ROLLUP(\"design:ref\", line_attachment)
order by design) TO STDOUT with CSV header;" > /tmp/attachments.csv
```

```sh
psql -d postgres://127.0.0.1:5432/osm -U <user> -c "COPY (select line_management, \"design:ref\" as design, count(*) as nb
from power_towers400kv
where \"design:ref\" IN ('A1', 'A2', 'B1', 'F44', 'F88', 'L1', 'T5')
group by ROLLUP(line_management, \"design:ref\")
order by design) TO STDOUT with CSV header;" > /tmp/management.csv
```