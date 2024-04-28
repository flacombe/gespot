import { ExpressionSpecification } from 'maplibre-gl'
import { LayerSpecificationWithZIndex } from './types.js'
import {scale_color, text_paint, operator_text, underground_p, poleRadius_p, materialColor_scale, lineOpacity_p, font} from './common.js';

const utilityTelecom_p: ExpressionSpecification = [
  'all',
  ['==', ['get', 'utility'], 'telecom'],
];

const telecomColor = '#297f00';
const telecomTextPaint = Object.assign({
  "text-color":telecomColor
}, text_paint);

// Colors
const mediumColor_scale = [
  ['fibre', '#61637A'],
  ['copper', '#ff8900'],
  ['coaxial', '#136fff'],
  [null,'#7A7A85']
]

// Function to assign power line thickness.
// Interpolate first by zoom level and then by voltage.
const lineThickness_p: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  2,
  0.5,
  10,
  [
    'interpolate',
    ['linear'],
    ['coalesce', ['get', 'capacity'], 0],
    0,
    1.5,
    72,
    2.6,
    578,
    4,
  ],
];

const layers: LayerSpecificationWithZIndex[] = [
  {
    zorder: 105,
    id: 'telecoms_line',
    type: 'line',
    source: 'gespot',
    filter: ['all', ['!', underground_p]],
    minzoom: 10,
    'source-layer': 'telecoms_communication_line',
    paint: {
      'line-color': scale_color("telecom:medium", mediumColor_scale),
      'line-width': lineThickness_p,
      'line-opacity': lineOpacity_p,
      'line-dasharray': [7, 2, 3]
    }
  },
  {
    zorder: 310,
    id: 'telecoms_pole_symbol',
    type: 'symbol',
    source: 'gespot',
    filter: [
      'all',
      utilityTelecom_p
    ],
    minzoom: 11,
    maxzoom:14.5,
    'source-layer': 'utility_support',
    paint: telecomTextPaint,
    layout: {
      'icon-image': [
        'case',
        ['get', 'transition'],
        'power_pole_transition',
        'telecom_pole',
      ],
      'icon-size': 0.5,
      'text-field': '{ref}',
      'text-font':font,
      'text-size': [
        'step',
        // Set visibility by using size
        ['zoom'],
        0,
        14,
        10
      ],
      'text-offset': [0, 1],
      'text-max-angle': 10
    }
  },
  {
    zorder: 312,
    id: 'telecoms_pole_point',
    type: 'circle',
    source: 'gespot',
    filter: [
      'all',
      utilityTelecom_p
    ],
    minzoom: 14.5,
    'source-layer': 'utility_support',
    paint: {
      'circle-radius': poleRadius_p,
      'circle-color': scale_color("material", materialColor_scale),
      'circle-stroke-color': telecomColor,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'],
          5, 0,
          6, 0.1,
          14, 0.5,
          17, 3
      ]
    }
  },
  {
    zorder:520,
    id: 'telecoms_pole_label',
    type: 'symbol',
    source: 'gespot',
    filter: [
      'all',
      utilityTelecom_p
    ],
    minzoom: 14.5,
    'source-layer': 'utility_support',
    paint: telecomTextPaint,
    layout: {
      'text-field': '{ref}',
      'text-font':font,
      'text-size': ['interpolate', ['linear'], ['zoom'], 11, 0, 12, 0, 12.01, 10],
      'text-offset': [0, 1],
      'text-anchor': 'top'
    }
  },
  {
    zorder: 405,
    id: 'telecoms_mast',
    type: 'symbol',
    source: 'gespot',
    minzoom: 10,
    'source-layer': 'telecoms_mast',
    paint: text_paint,
    layout: {
      'icon-image': 'comms_tower',
      'icon-anchor': 'bottom',
      'icon-size': ['interpolate', ["linear"], ["zoom"],
        10, 0.6,
        14, 1
      ],
      'text-field': operator_text,
      'text-font':font,
      'text-size': ['interpolate', ['linear'], ['zoom'], 11, 0, 12, 0, 12.01, 10],
      'text-anchor': 'top',
      'text-offset': ['interpolate', ['linear'], ['zoom'], 11, ['literal', [0, 1]], 16, ['literal', [0, 2]]],
      'text-optional': true
    }
  },
  {
    zorder: 550,
    id: 'telecoms_line_label',
    type: 'symbol',
    source: 'gespot',
    filter: ['all', ['!', underground_p]],
    minzoom: 9,
    'source-layer': 'telecoms_communication_line',
    paint: text_paint,
    layout: {
      'text-field': '{name}',
      'text-font':font,
      'symbol-placement': 'line',
      'symbol-spacing': 400,
      'text-size': 10,
      'text-offset': [0, 1],
      'text-max-angle': 10
    }
  }
];

export {layers as telecomLayers, telecomColor, mediumColor_scale};
