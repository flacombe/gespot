# Gespot
Il s'agit d'un socle logiciel pour visualiser les données patrimoniales géographiques des réseaux aériens électriques et télécoms présentes dans la base de données OpenStreetMap.

Il tire aventageusement parti de Node.js, Maplibre GL, Vite et Docker.

Les données géographiques visualisées peuvent être obtenues via un serveur de tuiles vectorielles conformes à la référence ci-dessous et par exemple déployé dans le cadre du [projet OpenInfraMap](https://github.com/flacombe/openinframap).

# Contexte

En France, plus largement en Europe, la connaissance des infrastructures d'accueil facilitant l'aménagement du territoire est une obligation légale.  
Ces connaissances permettent d'être plus agiles dans de futurs projets, d'assurer de choisir les solutions les plus résilientes et de réduire les coûts.

En particulier, la connaissance des supports de réseaux aérien fait défaut encore aujourd'hui.  
Le projet OpenStreetMap est une opportunité pour reconstruire durablement un socle informationnel permettant de ne pas oublier les connaissances produites dans le cadre du déploiement de la fibre optique entre 2000 et 2030.  
[Ce document](https://files.infos-reseaux.com/openstreetmap/poteaux_aode.pdf) vous permettra d'en savoir plus.

Le projet Gespot vise à visualiser et permettre des usages avancés des données contenues dans la base de donnés OpenStreetMap. Il ne produit aucune connaissance supplémentaire et vous êtes invités à contribuer au projet OpenStreetMap pour enrichir le contenu ou corriger les informations présentées en cas d'erreur.

Les données concernées sont produites au sein de grandes initiatives voisines :
* [Une convention de partenariat](enedis.openstreetmap.fr/) avec Enedis
* [Une contribution des acteurs](https://www.youtube.com/watch?v=EmwPZkQ9K-o) déployant la fibre optique via l'accès aux documents administratifs

# Installation

Il est possible d'installer le portail sur votre propre infrastructure.  
Reportez-vous [aux mentions légales](https://gespot.fr/legal.html) disponibles en ligne.

## Docker

Le serveur est construit en utilisant docker à la racine du projet :

```sh
docker build -f Dockerfile.prod -t gespot/web:latest .
```

## Proxy Nginx

La configuration nécessaire pour un reverse proxy Nginx est disponible dans le répertoire config.  
Vous aurez besoin d'éditer certains paramètres comme le nom de domaine ou les URL distantes.

```sh
ln -s config/gespot-proxy.conf /etc/nginx/sites-enabled/gespot.conf
```

## Configuration serveur

Quelques fichiers doivent être adaptés pour correspondre aux tuiles cartographiques utilisées.
* public/map.json : Adresse et contenu des tuiles utilisées pour décrire l'infrastructure
* public/natural.json : Adresse et contenu des tuiles utilisées pour décrire les éléments naturels
* src/style/style.json : Adresse des fichiers map.json à utiliser comme sources de données

# Mise en oeuvre

Pour lancer le serveur et accéder à l'interface, lancer simplement :

```sh
docker run -d --rm --name=gspweb -p 127.0.0.1:3102:80 gespot/web:latest
```

Le serveur sera ainsi accessible sur le port 3102, pensez à l'intégrer à la configuration du proxy ci-dessus.
