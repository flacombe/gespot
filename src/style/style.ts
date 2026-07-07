import i18next from 'i18next'
import style_base from './style_base.js'
import style_labels from './style_labels.js'
import style_gsp_power from './style_gsp_power.ts'
import style_gsp_telecoms from './style_gsp_telecoms.ts'
import style_gsp_natural from './style_gsp_natural.js'
import { StyleSpecification } from 'maplibre-gl'

const gsp_attribution = '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Gespot'

const style: StyleSpecification = {
  version: 8,
  projection: {
    type: "mercator"
  },
  name: "Gespot",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://api.maptiler.com/tiles/v3/tiles.json?key=2raHq2ahXwNHsKorHH5t"
    },
    gespot: {
      type: "vector",
      url: "https://gespot.fr/map.json"
    },
    natural: {
      type: "vector",
      url: "https://gespot.fr/natural.json"
    }
  },
  glyphs: '/fonts/{fontstack}/{range}.pbf',
  layers: []
}

export function getLayers() {
  return [
    ...style_gsp_power(),
    ...style_gsp_telecoms(),
    ...style_gsp_natural(),
  ]
}

export function getStyle() {
  const gsp_layers = [...getLayers(), ...style_labels(i18next.language)]

  gsp_layers.sort((a, b) => {
    if (!a.zorder || !b.zorder) {
      throw new Error('zorder is required for all layers')
    }
    if (a.zorder < b.zorder) return -1
    if (a.zorder > b.zorder) return 1
    return 0
  })

  style.layers = [...style_base, ...gsp_layers]
  return style
}