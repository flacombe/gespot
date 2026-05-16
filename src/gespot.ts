import maplibregl from 'maplibre-gl'
import { t } from 'i18next'
import { el, mount, text } from 'redom'
import { titleCase } from 'title-case'

import { LayerSwitcher, URLHash, Layer, LayerGroup } from '@russss/maplibregl-layer-switcher'

import $ from "jquery";
import 'bootstrap';
import 'bootstrap-slider';

import EditButton from './edit-control.js'
import InfoPopup from './popup/infopopup.js'
import HazardPopup from './popup/hazard-popup.js'
import KeyControl from './key/key.js'
import WarningBox from './warning-box/warning-box.js'
import OIMSearch from './search/search.ts'

import { getStyle, getLayers } from './style/style.js'
import {hazard_scale, hazardWidth} from './style/style_gsp_power.ts';

import { ValidationErrorPopup } from './popup/validation-error-popup.js'
import { SymbolLoader } from './symbol-loader.ts'
import { ClickRouter } from './click-router.js'

export default class Gespot {
  map?: maplibregl.Map
  hazardElectric_status: String | null

  isWebglSupported() {
    if (window.WebGLRenderingContext) {
      const canvas = document.createElement('canvas')
      try {
        const context =
          canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
          canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
        if (context && typeof context.getParameter == 'function') {
          return true
        }
      } catch {
        // WebGL is supported, but disabled
      }
      return false
    }
    // WebGL not supported
    return false
  }

  saveElectricHazardStatus(status: String | null){
    this.hazardElectric_status = status;
  }

  constructor() {
    if (!this.isWebglSupported()) {
      const infobox = new WarningBox(t('warning', 'Warning'))
      infobox.update(t('warnings.webgl'))
      mount(document.body, infobox)
    }
    this.hazardElectric_status = null;

    maplibregl.setRTLTextPlugin(
      'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
      true // Lazy load the plugin
    )
  }

  init() {
    const app = this;
    const layer_switcher = new LayerSwitcher(
      [
        new LayerGroup(t('layers.background'), [
          new Layer('A', t('openstreetmap'), 'osm_', 'background', true),
          new Layer('L', t('layers.labels'), 'label_', true)
        ]),
        new LayerGroup(t('layers.infrastructure'), [
          new Layer('P', t('layers.power'), 'power_', true),
          new Layer('T', t('layers.telecoms'), 'telecoms_', true)
        ]),
        new LayerGroup(t('layers.natural'), [
          new Layer('E', t('layers.vegetation'), 'vegetation_', false)
        ])
      ],
      t('layers.title', 'Couches')
    )
    const url_hash = new URLHash(layer_switcher)

    const map_style = getStyle()

    layer_switcher.setInitialVisibility(map_style)

    const map = new maplibregl.Map(
      url_hash.init({
        container: 'map',
        style: map_style,
        minZoom: 2,
        maxZoom: 21.5,
        zoom:4.9,
        center: [2.727, 46.125],
        localIdeographFontFamily: "'Apple LiSung', 'Noto Sans', 'Noto Sans CJK SC', sans-serif"
      })
    )

    const clickRouter = new ClickRouter(map, map_style.layers)
    new SymbolLoader(map)

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
      getLayers().map((layer: { [x: string]: any }) => layer['id']),
      6
    ).add(map, clickRouter)
    new HazardPopup(this,
      10
    ).add(map, clickRouter)
    //new ValidationErrorPopup(map, clickRouter)

    clickRouter.register()
    this.map = map

    let hazardArea_slider = el('input#panel_hazardSlider', {
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
    this.hazardElectric_status = "DMA";

    document.getElementsByTagName("header")[0].insertAdjacentElement("beforeend", 
      el('div#panel_hazard.mx-2.pt-1.pb-1.float-right.text-center.rounded-lg.alert-secondary', [
        el('div#panel_hazardLink.d-inline-block.mr-3.align-text-top.text-left', [
          el('img', {"src":"img/iso_7010_w012.svg", "height":25}),
          el('a.text-danger', {"data-toggle":"modal", "data-target":"#electricityModal"}, 
            text(titleCase(t('hazard.electric.prevent', 'electric hazard prevention'), {sentenceCase: true}))
          ),
      ]),
        el('div.d-inline-block.align-text-top',hazardArea_slider)
    ]));

    $("#panel_hazardSlider").slider().on("slideStop", function(ui: any){
      let layerName = "power_line_hazard";
      switch(ui.value){
        case 1:
          map.setPaintProperty(layerName, "line-color", hazard_scale["DMA"]);
          map.setPaintProperty(layerName, "line-width", hazardWidth("DMA"));
          map.setLayoutProperty(layerName, 'visibility', 'visible');
          app.saveElectricHazardStatus("DMA");
          break;
        case 2:
          map.setPaintProperty(layerName, "line-color", hazard_scale["DLVR"]);
          map.setPaintProperty(layerName, "line-width", hazardWidth("DLVR"));
          map.setLayoutProperty(layerName, 'visibility', 'visible');
          app.saveElectricHazardStatus("DLVR");
          break;
        case 3:
          map.setPaintProperty(layerName, "line-color", hazard_scale["DLVS"]);
          map.setPaintProperty(layerName, "line-width", hazardWidth("DLVS"));
          map.setLayoutProperty(layerName, 'visibility', 'visible');
          app.saveElectricHazardStatus("DLVS");
          break;
        case 4:
          map.setPaintProperty(layerName, "line-color", hazard_scale["DLI"]);
          map.setPaintProperty(layerName, "line-width", hazardWidth("DLI"));
          map.setLayoutProperty(layerName, 'visibility', 'visible');
          app.saveElectricHazardStatus("DLI");
          break;
        default:
          map.setLayoutProperty(layerName, 'visibility', 'none');
          app.saveElectricHazardStatus(null);
          break;
      }
    })
  }
}
