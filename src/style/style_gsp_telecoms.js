import {text_paint, operator_text, underground_p, construction_p, lineOpacity_p} from './style_gsp_common.js';

const utilityTelecom_p = [
  'all',
  ['==', ['get', 'utility'], 'telecom'],
];

const layers = [
  {
    zorder: 40,
    id: 'telecoms_line',
    type: 'line',
    source: 'gespot',
    filter: ['all', ['!', underground_p]],
    minzoom: 3,
    'source-layer': 'telecoms_communication_line',
    paint: {
      'line-color': '#61637A',
      'line-width': ['interpolate', ['linear'], ['zoom'],
        3, 0.3,
        11, 2
      ],
      'line-dasharray': [3, 2],
    },
  },
  {
    zorder: 141,
    id: 'telecoms_pole',
    type: 'symbol',
    source: 'gespot',
    filter: [
      'all',
      utilityTelecom_p
    ],
    minzoom: 10,
    'source-layer': 'utility_support',
    paint: text_paint,
    layout: {
      'icon-image': [
        'case',
        ['get', 'transition'],
        'power_pole_transition',
        'power_pole',
      ],
      'icon-size': 0.5,
      'text-field': '{ref}',
      'text-size': [
        'step',
        // Set visibility by using size
        ['zoom'],
        0,
        14,
        10,
      ],
      'text-offset': [0, 1],
      'text-max-angle': 10,
    },
  },
  {
    zorder: 141,
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
      'text-size': {
        "stops": [
          [11, 0],
          [12, 0],
          [12.01, 10]
        ],
      },
      'text-anchor': 'top',
      'text-offset': {
        'stops': [
          [11, [0, 1]],
          [16, [0, 2]]
        ]
      },
      'text-optional': true
    },
  },
  {
    id: 'telecoms_line_label',
    type: 'symbol',
    source: 'gespot',
    filter: ['all', ['!', underground_p]],
    minzoom: 9,
    'source-layer': 'telecoms_communication_line',
    paint: text_paint,
    layout: {
      'text-field': '{name}',
      'symbol-placement': 'line',
      'symbol-spacing': 400,
      'text-size': 10,
      'text-offset': [0, 1],
      'text-max-angle': 10
    }
  },

];

export default layers;
