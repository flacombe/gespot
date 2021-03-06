# OIM Frontend
The following is useful resources to expose map of relevant overhead telco and power utilities according to layers defined in OIM-styles repository.

It makes use of Node.js, Mapbox GL and webpack.
This repository provides simple web server configuration file for Nginx

# Setup

## Nginx config

Useful configuration for webserver is located in config/oim.conf
Tou need to link it to Nginx directory and eventually edit the server_name and locations if required

    ln -s config/gespot.conf /etc/nginx/sites-enabled/gespot.conf

## Online resources

A few files need to be edited to match the server configuration
* dist/map.json : tiles URL
* src/index.js : Adjust map_style.sprite URL
* src/style/style.json : Adjust URL to map.json in openinframap source

# Running

To launch the server and makes the UI available, run the simple :

    npm run-script build

Wait for the end of the compilation to access the web URL

# Layers

Z orders:

To be defined shortly

## Declare new layers

Declaring new layers is described here as a new style which requires to already have an according container in the MVT tiles generated by the server

### map.json

Layers have to be declared in dist/map.json to map them with the tiles got from the server.
Add the one you want in the vector_layers array with the following information :
* id : MVT layer id, the same you find in the tiles
* description : Human readable explanation
* fields : Particular fields to render in the features infobox

Example :
```json
    {"id": "power_transformer", "description": "Power transformers", "fields": {}}
```

### Style

Find the JS file responsible of the style definition you want to declare your layer in.
They're located in src/style and arranged by OIM domain.
Please conform to the z-indicies list upside in this document.

A layers array can be found at the bottom of each .js file.
Ids are arbitrary names and don't need to be equivalent to tiles layer id.
Declare the mvt layer's name in source-layer key.

### Key

Gespot key requires a special declaration to be updated according to declared style.
As styles may contains a complex set of rules and layouts, the most representative of them have to be explicitely chosen to fill the web key.
Go in src/key/key.js and adapt the code accordint to the needs of the new layer (more detailed documentation required for this particular point).
