import './index.css';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css';

import {mount,el} from 'redom';

import EditButton from './editbutton.js';
import URLHash from './urlhash.js';
import InfoBox from './infobox.js';
import InfoPopup from './infopopup.js';
import KeyControl from './key/key.js';
import LayerSwitcher from './layerswitcher/layerswitcher.js';
import AddokGeocoder from './geocoder/addok.js';

import map_style from './style/style.json';
import style_base from './style/style_base.js';
import style_labels from './style/style_labels.js';
import {default as style_gsp_power, voltage_scale, special_voltages, warningAreas_filters} from './style/style_gsp_power.js';
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
    maxZoom: 18.9,
    center: [2.727, 46.125],
    zoom:4.9
  }, url_hash.getPosition()));

  var geocoder = new AddokGeocoder("https://demo.addok.xyz");

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
  map.addControl(new EditButton(), 'bottom-right');
  map.addControl(
    new MapboxGeocoder({
      accessToken: "no_token",
      localGeocoder: geocoder.geocode,
      localGeocoderOnly: true,
      zoom: 14,
      placeholder: 'Recherche',
      mapboxgl: mapboxgl
    })
  );
  new InfoPopup(gsp_layers.map(layer => layer['id']), 9).add(map);
  
  let warningArea_slider = el('input#panel_warningSlider', {
    "type":"text",
    "data-provide":"slider",
    "data-slider-ticks":'[0, 1, 2, 3, 4]',
    "data-slider-ticks-labels":'["-", "DMA", "DLVR", "DLVS", "DLI"]',
    "data-slider-min":"0",
    "data-slider-max":"4",
    "data-slider-step":"1",
    "data-slider-value":"1",
    "data-slider-tooltip":"hide",
    "data-slider-rangeHighlights":'[{ "start": 0, "end": 1, "class": "bg-danger" },{ "start": 1, "end": 3, "class": "bg-warning" },{ "start": 3, "end": 4, "class": "bg-info"}]'
  });

  document.getElementsByTagName("header")[0].insertAdjacentElement("beforeend", el('div.pt-2.mr-1.float-right', [
    el('div.d-inline.mx-5',[warningArea_slider]),
    layer_switcher.onAdd(map)
  ]), document.getElementsByTagName("h1")[0]);

  $("#panel_warningSlider").slider().on("slideStop", function(){
    switch(this.value){
      case "1":
        map.setFilter("power_line_warning", warningAreas_filters["DMA"]);
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      case "2":
        map.setFilter("power_line_warning", warningAreas_filters["DLVR"]);
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      case "3":
        map.setFilter("power_line_warning", warningAreas_filters["DLVS"]);
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      case "4":
        map.setFilter("power_line_warning", warningAreas_filters["DLI"]);
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      default:
        map.setLayoutProperty("power_line_warning", 'visibility', 'none');
        break;
    }
  })
}

if (document.readyState != 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
