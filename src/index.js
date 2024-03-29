import './index.css';
import maplibregl from 'maplibre-gl';

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

import map_style from './style/style.json';
import style_base from './style/style_base.js';
import style_labels from './style/style_labels.js';
import {default as style_gsp_power, warning_scale, warningWidth} from './style/style_gsp_power.js';
import style_gsp_telecoms from './style/style_gsp_telecoms.js';

function init() {
  if (!maplibregl.supported({failIfMajorPerformanceCaveat: true})) {
    const infobox = new InfoBox('Warning');
    infobox.update(
      'Your browser may have performance or functionality issues with OpenInfraMap.<br/>' +
        '<a href="http://webglreport.com">WebGL</a> with hardware acceleration is required for this site ' +
        'to perform well.',
    );
    mount(document.body, infobox);
  }

  maplibregl.setRTLTextPlugin(
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

  var map = new maplibregl.Map(Object.assign({
    container: 'map',
    style: map_style,
    hash: false,
    minZoom: 2,
    maxZoom: 20.9,
    center: [2.727, 46.125],
    zoom:4.9
  }, url_hash.getPosition()));

  url_hash.onAdd(map);
  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    }),
  );
  map.addControl(new KeyControl(), 'top-right');
  map.addControl(new EditButton(), 'bottom-right');
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
        map.setPaintProperty("power_line_warning", "line-color", warning_scale["DMA"]);
        map.setPaintProperty("power_line_warning", "line-width", warningWidth("DMA"));
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      case "2":
        map.setPaintProperty("power_line_warning", "line-color", warning_scale["DLVR"]);
        map.setPaintProperty("power_line_warning", "line-width", warningWidth("DLVR"));
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      case "3":
        map.setPaintProperty("power_line_warning", "line-color", warning_scale["DLVS"]);
        map.setPaintProperty("power_line_warning", "line-width", warningWidth("DLVS"));
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      case "4":
        map.setPaintProperty("power_line_warning", "line-color", warning_scale["DLI"]);
        map.setPaintProperty("power_line_warning", "line-width", warningWidth("DLI"));
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
