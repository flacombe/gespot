import './index.css';
import mapboxgl from 'mapbox-gl';

import {mount} from 'redom';

import EditButton from './editbutton.js';
import URLHash from './urlhash.js';
import InfoBox from './infobox.js';
import InfoPopup from './infopopup.js';
import KeyControl from './key/key.js';
import LayerSwitcher from './layerswitcher/layerswitcher.js';

import map_style from './style/style.json';
import style_base from './style/style_base.js';
import style_labels from './style/style_labels.js';
import style_gsp_power from './style/style_gsp_power.js';
import style_gsp_telecoms from './style/style_gsp_telecoms.js';

function init() {
  if (!mapboxgl.supported({failIfMajorPerformanceCaveat: true})) {
    const infobox = new InfoBox('Warning');
    infobox.update(
      'Your browser may have performance or functionality issues with OpenInfraMap.<br/>' +
        '<a href="http://webglreport.com">WebGL</a> with hardware acceleration is required for this site ' +
        'to perform well.',
    );
    mount(document.body, infobox);
  }

  mapboxgl.setRTLTextPlugin(
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
    null,
    true, // Lazy load the plugin
  );

  var gsp_layers = style_gsp_power.concat(
    style_gsp_telecoms
  );

  gsp_layers.sort((a, b) => {
    if (a['zorder'] < b['zorder']) return -1;
    if (a['zorder'] > b['zorder']) return 1;
    return 0;
  });

  const layers = {
    Power: 'power_',
    Telecoms: 'telecoms_',
    Labels: 'place_',
  };
  const layers_enabled = ['Power', 'Telecoms', 'Labels'];
  const layer_switcher = new LayerSwitcher(layers, layers_enabled);
  var url_hash = new URLHash(layer_switcher);
  layer_switcher.urlhash = url_hash;

  map_style.layers = style_base.concat(gsp_layers, style_labels);

  layer_switcher.setInitialVisibility(map_style);

  if (DEV) {
    map_style['sprite'] = 'http://localhost:8080/style/sprite';
  }

  var map = new mapboxgl.Map(Object.assign({
    container: 'map',
    style: map_style,
    hash: false,
    minZoom: 2,
    maxZoom: 17.9,
    center: [12, 26],
  }, url_hash.getPosition()));

  url_hash.onAdd(map);
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    }),
  );
  map.addControl(new KeyControl(), 'top-right');
  map.addControl(layer_switcher, 'top-right');
  map.addControl(new EditButton(), 'bottom-right');
  new InfoPopup(gsp_layers.map(layer => layer['id']), 9).add(map);
}

if (document.readyState != 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
