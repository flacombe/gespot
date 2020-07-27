import {scale_color, text_paint, operator_text, construction_p, underground_p, poleRadius_p, materialColor_scale, lineOpacity_p} from './style_gsp_common.js';

const utilityTelecom_p = [
  'all',
  ['==', ['get', 'utility'], 'telecom'],
];

// Colors
const medium_scale = [
  ['fibre', '#61637A'],
  ['copper', '#ff8900'],
  ['coaxial', '#136fff'],
  [null,'#7A7A85']
]

// Function to assign power line thickness.
// Interpolate first by zoom level and then by voltage.
const lineThickness_p = [
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
    1,
    72,
    1.8,
    578,
    4,
  ],
];

const layers = [
  {
    zorder: 40,
    id: 'telecoms_line',
    type: 'line',
    source: 'gespot',
    filter: ['all', ['!', underground_p]],
    minzoom: 10,
    'source-layer': 'telecoms_communication_line',
    paint: {
      'line-color': scale_color("telecom:medium", medium_scale),
      'line-width': lineThickness_p,
      'line-opacity': lineOpacity_p,
      'line-dasharray': [7, 2, 3],
    },
  },
  {
    zorder: 140,
    id: 'telecoms_pole_symbol',
    type: 'symbol',
    source: 'gespot',
    filter: [
      'all',
      utilityTelecom_p
    ],
    minzoom: 12,
    maxzoom:14.5,
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
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'],
          5, 0,
          6, 0.1,
          8, 0.5,
          15, 1
      ]
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
