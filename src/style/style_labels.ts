import { LayerSpecificationWithZIndex } from './types.ts'
import { get_country_name } from './protomaps_language.ts'
import { font } from './common.ts'
import {
  all,
  has,
  get,
  interpolate,
  coalesce,
  match,
  case_,
  any,
  zoom,
  concat,
  step,
  round,
  literal,
  if_,
  not,
  rgb
} from './stylehelpers.ts'
import { DataDrivenPropertyValueSpecification } from 'maplibre-gl'

const label_color = ['hsl(0, 0%, 20%)', 'hsl(0, 0%, 30%)', 'hsl(0, 0%, 40%)']
const text_halo_color = 'rgb(242,243,240)'

function pmLabel(lang: string): DataDrivenPropertyValueSpecification<string> {
  return get_country_name(lang, undefined) as DataDrivenPropertyValueSpecification<string>
}

export default function layers(lang: string): LayerSpecificationWithZIndex[] {
  return [
    {
      zorder: 105,
      id: 'label_suburb',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 12,
      maxzoom: 17,
      filter: all(['==', '$type', 'Point'], ['==', 'class', 'suburb']),
      layout: {
        'text-anchor': 'center',
        'text-field': '{name:latin}\n{name:nonlatin}',
        'text-font': ['Noto Sans Regular'],
        'text-justify': 'center',
        'text-offset': [0.5, 0],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 17, 17]
      },
      paint: {
        'text-color': label_color[2],
        'text-halo-blur': 1,
        'text-halo-color': text_halo_color,
        'text-halo-width': 2
      }
    },
    {
      zorder: 106,
      id: 'label_village',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 12,
      maxzoom: 17,
      filter: all(['==', '$type', 'Point'], ['==', 'class', 'village']),
      layout: {
        'text-anchor': 'center',
        'text-field': '{name:latin}\n{name:nonlatin}',
        'text-font': ['Noto Sans Regular'],
        'text-justify': 'center',
        'text-offset': [0.5, 0.2],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 17, 18]
      },
      paint: {
        'text-color': label_color[2],
        'text-halo-blur': 1,
        'text-halo-color': text_halo_color,
        'text-halo-width': 2
      }
    },
    {
      zorder: 107,
      id: 'label_town',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 10,
      maxzoom: 15,
      filter: all(['==', '$type', 'Point'], ['==', 'class', 'town']),
      layout: {
        'text-anchor': 'center',
        'text-field': '{name:latin}\n{name:nonlatin}',
        'text-font': ['Noto Sans Regular'],
        'text-justify': 'center',
        'text-offset': [0.5, 0.2],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 9, 15, 18]
      },
      paint: {
        'text-color': label_color[0],
        'text-halo-blur': 1,
        'text-halo-color': text_halo_color,
        'text-halo-width': 2
      }
    },
    {
      zorder: 108,
      id: 'label_city',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 7.5,
      maxzoom: 12,
      filter: all(
        ['==', '$type', 'Point'],
        all(['!=', 'capital', 2], ['==', 'class', 'city'], ['>', 'rank', 3])
      ),
      layout: {
        'text-anchor': 'center',
        'text-field': '{name:latin}\n{name:nonlatin}',
        'text-font': ['Noto Sans Regular'],
        'text-justify': 'center',
        'text-offset': [0.5, 0.2],
        'text-size': 12,
        visibility: 'visible'
      },
      paint: {
        'text-color': label_color[0],
        'text-halo-blur': 1,
        'text-halo-color': text_halo_color,
        'text-halo-width': 2
      }
    },
    {
      zorder: 109,
      id: 'label_capital',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 5.5,
      maxzoom: 12,
      filter: all(['==', '$type', 'Point'], ['==', 'capital', 2], ['==', 'class', 'city']),
      layout: {
        'text-anchor': 'center',
        'text-field': '{name:latin}\n{name:nonlatin}',
        'text-font': ['Noto Sans Regular'],
        'text-justify': 'center',
        'text-offset': [0.5, 0.2],
        'text-size': 14,
        visibility: 'visible'
      },
      paint: {
        'text-color': label_color[0],
        'text-halo-blur': 1,
        'text-halo-color': text_halo_color,
        'text-halo-width': 2
      }
    },
    {
      zorder: 110,
      id: 'label_city_large',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 7,
      maxzoom: 12,
      filter: all(['==', '$type', 'Point'], ['!=', 'capital', 2], ['<=', 'rank', 3], ['==', 'class', 'city']),
      layout: {
        'text-anchor': 'center',
        'text-field': '{name:latin}\n{name:nonlatin}',
        'text-font': ['Noto Sans Regular'],
        'text-justify': 'center',
        'text-offset': [0.5, 0.2],
        'text-size': 14,
        visibility: 'visible'
      },
      paint: {
        'text-color': label_color[0],
        'text-halo-blur': 1,
        'text-halo-color': text_halo_color,
        'text-halo-width': 2
      }
    },
    {
      zorder: 111,
      id: 'label_state',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 5,
      maxzoom: 12,
      filter: all(['==', '$type', 'Point'], ['==', 'class', 'state']),
      layout: {
        'text-field': '{name:latin}\n{name:nonlatin}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 15,
        visibility: 'visible'
      },
      paint: {
        'text-color': label_color[0],
        'text-halo-blur': 1,
        'text-halo-color': text_halo_color,
        'text-halo-width': 2
      }
    },
    {
      zorder: 112,
      id: 'label_country_other',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      maxzoom: 8,
      filter: all(['==', '$type', 'Point'], ['==', 'class', 'country'], ['!has', 'iso_a2']),
      layout: {
        'text-field': ['case', ['has', 'name:en'], ['get', 'name:en'], ['get', 'name:latin']],
        'text-font': ['Metropolis Light Italic', 'Noto Sans Regular Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 0, 9, 6, 15]
      },
      paint: {
        'text-color': label_color[1],
        'text-halo-color': text_halo_color,
        'text-halo-width': 2
      }
    },
    {
      zorder: 113,
      id: 'label_country_minor',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      maxzoom: 8,
      filter: all(
        ['==', '$type', 'Point'],
        ['==', 'class', 'country'],
        ['>=', 'rank', 2],
        ['has', 'iso_a2']
      ),
      layout: {
        'text-field': ['case', ['has', 'name:en'], ['get', 'name:en'], ['get', 'name:latin']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 0, 10, 6, 12]
      },
      paint: {
        'text-color': label_color[1],
        'text-halo-color': text_halo_color,
        'text-halo-width': 2
      }
    },
    {
      zorder: 114,
      id: 'label_country_major',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      maxzoom: 5,
      filter: all(
        ['==', '$type', 'Point'],
        ['<=', 'rank', 1],
        ['==', 'class', 'country'],
        ['has', 'iso_a2']
      ),
      layout: {
        'text-anchor': 'center',
        'text-field': ['case', ['has', 'name:en'], ['get', 'name:en'], ['get', 'name:latin']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 0, 10, 3, 12, 4, 14]
      },
      paint: {
        'text-color': label_color[0],
        'text-halo-color': text_halo_color,
        'text-halo-width': 2.4
      }
    }
  ]
}
