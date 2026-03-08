-- Ensemble de requetes pour la documentation des supports de RTE, en particulier ceux du réseau 400 kV.

-- Répartition des familles vs anchor/suspension
select "design:ref" as design,
line_attachment as la,
count(*) as nb
from power_towers400kv
where "design:ref" IN ('A1', 'A2', 'B1', 'F44', 'F88', 'L1', 'T5')
group by ROLLUP("design:ref", line_attachment)
order by design;

-- Repartition des fonctions particulières
select line_management, "design:ref" as design, count(*) as nb
from power_towers400kv
where "design:ref" IN ('A1', 'A2', 'B1', 'F44', 'F88', 'L1', 'T5')
group by ROLLUP(line_management, "design:ref")
order by design;

-- Extraction des géométries de circuits
create materialized view power_circuits as with circuits as (
  select id, operator, "ref:fr:rte", voltage, (st_dump(geometry)).geom as geometry from power_rel400kv
)
select c.* from circuits c where st_isclosed(c.geometry) = false and "ref:fr:rte" is not null;

-- Vue des cantons de lignes
create materialized view power_circuits_cantons as with towers as (
  select geometry from power_towers400kv where line_attachment='anchor' and operator='RTE'
),
lines as (
  select geometry, id as osm_id, "ref:fr:rte" from power_circuits where voltage ~ '(^|;)400000(;|$)' and st_length(geometry::geography) > 250
),
multip as (
  select st_collect(t.geometry) as anchors, l.geometry as line_geom, l.osm_id as line_id, l."ref:fr:rte"
  from lines l
  join towers t ON st_intersects(t.geometry, l.geometry)
  group by l.osm_id, l.geometry, l."ref:fr:rte"
)  
select 
  m.line_id, m."ref:fr:rte", (st_dump(st_split(m.line_geom, m.anchors))).geom as geom
  from multip m;

-- Statistiques des cantons par circuit
select "ref:fr:rte", count(*) as nb, sum(st_length(geom::geography)) as len, avg(st_length(geom::geography)) as moyenne, min(st_length(geom::geography)) as mini, max(st_length(geom::geography)) as maxi
from power_circuits_cantons
group by "ref:fr:rte"
order by len desc, nb;

-- Volume des familles de supports par circuit
select count(*) as nb, t."design:ref", c."ref:fr:rte"
from power_circuits c
join power_towers400kv t on ST_intersects(t.geometry, c.geometry)
group by c."ref:fr:rte", t."design:ref"
order by c."ref:fr:rte", t."design:ref";

-- Angles des ancrages 2 directions
