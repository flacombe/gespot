import maplibregl from 'maplibre-gl'
import { el, mount } from 'redom'

import $ from "jquery";
import './bootstrap.ts';

import './index.css';

import LayerSwitcher from '@russss/maplibregl-layer-switcher'
import URLHash from '@russss/maplibregl-layer-switcher/urlhash'
import { LayerSpecificationWithZIndex } from './style/types.ts'

import EditButton from './editbutton.ts'
import InfoPopup from './infopopup.ts'
import KeyControl from './key/key.ts'
import WarningBox from './warning-box/warning-box.ts'

import map_style from './style/style.ts'
import style_base from './style/style_base.ts'
import style_labels from './style/style_labels.ts'
import {powerLayers as style_gsp_power, warningAreas_filters, warningWidth} from './style/style_gsp_power.ts';
import {telecomLayers as style_gsp_telecoms} from './style/style_gsp_telecoms.ts'
import {vegetationLayers as style_gsp_vegetation} from './style/style_gsp_vegetation.ts'
import loadIcons from './loadIcons.ts'

function isWebglSupported() {
  if (window.WebGLRenderingContext) {
    const canvas = document.createElement('canvas')
    try {
      const context =
        canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
      if (context && typeof context.getParameter == 'function') {
        return true
      }
    } catch (e) {
      // WebGL is supported, but disabled
    }
    return false
  }
  // WebGL not supported
  return false
}

function init() {
  if (!isWebglSupported()) {
    const infobox = new WarningBox('WebGL est absent')
    infobox.update(
      '<p>Votre navigateur peut rencontrer des problèmes à l\'utilisation de Gespot.fr</p>' +
        '<p><a href="http://webglreport.com">WebGL</a> avec une accélération matérielle est nécessaire pour utiliser cette application correctement.</p>' +
        '<p>Si votre navigateur supporte effectivement WebGL, il faut désactiver les restrictions particulières pour ce site.</p>'
    )
    mount(document.body, infobox)
  }

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
  const layers_enabled = ['Electricité', 'Télécoms'];
  const layer_switcher = new LayerSwitcher(layers, layers_enabled);
  var url_hash = new URLHash(layer_switcher);
  layer_switcher.urlhash = url_hash;

  map_style.layers = style_base.concat(gsp_layers, style_labels);

  layer_switcher.setInitialVisibility(map_style);

  // Disclaimer
  $('#disclaimerModal').modal('show');

  // Map
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
