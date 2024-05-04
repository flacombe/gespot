import './index.css'
import maplibregl from 'maplibre-gl'
import { el } from 'redom'

import $ from "jquery";

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css';

import LayerSwitcher from '@russss/maplibregl-layer-switcher'
import URLHash from '@russss/maplibregl-layer-switcher/urlhash'
import { LayerSpecificationWithZIndex } from './style/types.js'

import EditButton from './editbutton.js'
import InfoPopup from './infopopup.js'
import KeyControl from './key/key.js'

import map_style from './style/style.js'
import style_base from './style/style_base.ts'
import style_labels from './style/style_labels.js'
import {powerLayers as style_gsp_power, warningAreas_filters, warningWidth} from './style/style_gsp_power.js';
import {telecomLayers as style_gsp_telecoms} from './style/style_gsp_telecoms.js'
import {vegetationLayers as style_gsp_vegetation} from './style/style_gsp_vegetation.js'
import loadIcons from './loadIcons.js'

function init() {
  /*if (!maplibregl.supported({failIfMajorPerformanceCaveat: true})) {
    const infobox = new InfoBox('Warning');
    infobox.update(
      'Your browser may have performance or functionality issues with OpenInfraMap.<br/>' +
        '<a href="http://webglreport.com">WebGL</a> with hardware acceleration is required for this site ' +
        'to perform well.',
    );
    mount(document.body, infobox);
  }*/

  const gsp_layers: LayerSpecificationWithZIndex[] = [
    ...style_gsp_power,
    ...style_gsp_telecoms,
    ...style_gsp_vegetation
  ];

  gsp_layers.sort((a, b) => {
    if (!a.zorder || !b.zorder) return 0
    if (a.zorder < b.zorder) return -1
    if (a.zorder > b.zorder) return 1
    return 0
  })

  const layers = {
    'Electricité': 'power_',
    'Télécoms': 'telecoms_',
    'Végétation': 'vegetation_',
  };
  const layers_enabled = ['Elec', 'Télécoms'];
  const layer_switcher = new LayerSwitcher(layers, layers_enabled);
  var url_hash = new URLHash(layer_switcher);
  layer_switcher.urlhash = url_hash;

  map_style.layers = style_base.concat(gsp_layers, style_labels);

  layer_switcher.setInitialVisibility(map_style);

  const map = new maplibregl.Map(
    url_hash.init({
      container: 'map',
      style: map_style,
      minZoom: 2,
      maxZoom: 20.9,
      center: [2.727, 46.125],
      zoom:4.9,
      localIdeographFontFamily: "'Apple LiSung', 'Noto Sans', 'Noto Sans CJK SC', sans-serif"
    })
  )

  loadIcons(map)

  map.dragRotate.disable()
  map.touchZoomRotate.disableRotation()

  url_hash.enable(map)
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  map.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    })
  )

  map.addControl(new maplibregl.ScaleControl({}), 'bottom-left')

  map.addControl(new KeyControl(), 'top-right')
  map.addControl(layer_switcher, 'top-right')
  map.addControl(new EditButton(), 'bottom-right')
  new InfoPopup(
    gsp_layers.map((layer: { [x: string]: any }) => layer['id']),
    9
  ).add(map);
  
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
    el('div.d-inline.mx-5',[warningArea_slider])
  ]));

  $("#panel_warningSlider").slider().on("slideStop", function(ui: any){
    switch(ui.value){
      case 1:
        map.setPaintProperty("power_line_warning", "line-color", warningAreas_filters["DMA"]);
        map.setPaintProperty("power_line_warning", "line-width", warningWidth("DMA"));
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      case 2:
        map.setPaintProperty("power_line_warning", "line-color", warningAreas_filters["DLVR"]);
        map.setPaintProperty("power_line_warning", "line-width", warningWidth("DLVR"));
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      case 3:
        map.setPaintProperty("power_line_warning", "line-color", warningAreas_filters["DLVS"]);
        map.setPaintProperty("power_line_warning", "line-width", warningWidth("DLVS"));
        map.setLayoutProperty("power_line_warning", 'visibility', 'visible');
        break;
      case 4:
        map.setPaintProperty("power_line_warning", "line-color", warningAreas_filters["DLI"]);
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
