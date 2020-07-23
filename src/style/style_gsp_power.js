import {text_paint, underground_p, construction_p, lineOpacity_p} from './style_gsp_common.js';

const voltage_scale = [
  [null, '#7A7A85'],
  [10, '#6E97B8'],
  [25, '#55B555'],
  [52, '#B59F10'],
  [132, '#B55D00'],
  [220, '#C73030'],
  [330, '#B54EB2'],
  [550, '#00C1CF'],
];

const special_voltages = {
  HVDC: '#4E01B5',
  'Traction (<50 Hz)': '#A8B596',
};

// Power utility predicates
const utilityTelecom_p = [
  'all',
  ['==', ['get', 'utility'], 'power'],
];

// === Frequency predicates
const hvdc_p = [
  'all',
  ['has', 'frequency'],
  ['!=', ['get', 'frequency'], ''],
  ['==', ['to-number', ['get', 'frequency']], 0],
];

// Stepwise function to assign colour by voltage:
function voltage_color(field) {
  let voltage_func = ['step', ['coalesce', ['get', field], 0]];
  for (let row of voltage_scale) {
    if (row[0] == null) {
      voltage_func.push(row[1]);
      continue;
    }
    voltage_func.push(row[0] - 0.01);
    voltage_func.push(row[1]);
  }

  return [
    'case',
    hvdc_p,
    special_voltages['HVDC'], // HVDC (frequency == 0)
    voltage_func,
  ];
}

const multi_voltage_min_zoom = 10;

// Generate an expression to determine the offset of a power line
// segment with multiple voltages
function voltage_offset(index) {
  const spacing = 7;

  let offset = (index - 1) * spacing;
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    multi_voltage_min_zoom,
    [
      'case',
      ['has', 'voltage_3'],
      (offset - spacing) * 0.5,
      ['has', 'voltage_2'],
      (offset - spacing / 2) * 0.5,
      0,
    ],
    13,
    [
      'case',
      ['has', 'voltage_3'],
      offset - spacing,
      ['has', 'voltage_2'],
      offset - spacing / 2,
      0,
    ],
  ];
}

// Function to assign power line thickness.
// Interpolate first by zoom level and then by voltage.
const voltage_line_thickness = [
  'interpolate',
  ['linear'],
  ['zoom'],
  2,
  0.5,
  10,
  [
    'match',
    ['get', 'line'],
    'bay',
    1,
    'busbar',
    1,
    [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'voltage'], 0],
      0,
      1,
      100,
      1.8,
      800,
      4,
    ],
  ],
];

const label_offset = {
  stops: [[8, [0, 3]], [13, [0, 1]]],
};

// Determine substation visibility
const substation_visible_p = [
  'all',
  [
    'any',
    ['>', ['coalesce', ['get', 'voltage'], 0], 399],
    [
      'all',
      ['>', ['coalesce', ['get', 'voltage'], 0], 200],
      ['>', ['zoom'], 6],
    ],
    [
      'all',
      ['>', ['coalesce', ['get', 'voltage'], 0], 100],
      ['>', ['zoom'], 7],
    ],
    ['all', ['>', ['coalesce', ['get', 'voltage'], 0], 25], ['>', ['zoom'], 9]],
    ['all', ['>', ['coalesce', ['get', 'voltage'], 0], 9], ['>', ['zoom'], 10]],
    ['>', ['zoom'], 11],
  ],
  ['!=', ['get', 'substation'], 'transition'],
];

const substation_radius = [
  'interpolate',
  ['linear'],
  ['zoom'],
  5,
  1,
  12,
  [
    'interpolate',
    ['linear'],
    ['coalesce', ['get', 'voltage'], 0],
    0,
    3,
    300,
    7,
    600,
    9,
  ],
];

// Determine the minimum zoom a point is visible at (before it can be seen as an
// area), based on the area of the substation.
const substation_point_visible_p = [
  'any',
  ['==', ['coalesce', ['get', 'area'], 0], 0], // Area = 0 - mapped as node
  ['all', ['<', ['coalesce', ['get', 'area'], 0], 100], ['<', ['zoom'], 16]],
  ['all', ['<', ['coalesce', ['get', 'area'], 0], 250], ['<', ['zoom'], 15]],
  ['<', ['zoom'], 13],
];

const substation_label_visible_p = [
  'all',
  [
    'any',
    ['>', ['coalesce', ['get', 'voltage'], 0], 399],
    [
      'all',
      ['>', ['coalesce', ['get', 'voltage'], 0], 200],
      ['>', ['zoom'], 8],
    ],
    [
      'all',
      ['>', ['coalesce', ['get', 'voltage'], 0], 100],
      ['>', ['zoom'], 10],
    ],
    [
      'all',
      ['>', ['coalesce', ['get', 'voltage'], 0], 50],
      ['>', ['zoom'], 16],
    ],
    ['>', ['zoom'], 16],
  ],
  ['!=', ['get', 'substation'], 'transition'],
];

// Power line / substation visibility
const power_visible_p = [
  'all',
  [
    'any',
    ['>', ['coalesce', ['get', 'voltage'], 0], 199],
    ['all', ['>', ['coalesce', ['get', 'voltage'], 0], 99], ['>', ['zoom'], 4]],
    ['all', ['>', ['coalesce', ['get', 'voltage'], 0], 49], ['>', ['zoom'], 5]],
    ['all', ['>', ['coalesce', ['get', 'voltage'], 0], 24], ['>', ['zoom'], 6]],
    ['all', ['>', ['coalesce', ['get', 'voltage'], 0], 9], ['>', ['zoom'], 7]],
    ['>', ['zoom'], 10],
  ],
  [
    'any',
    ['all', ['!=', ['get', 'line'], 'busbar'], ['!=', ['get', 'line'], 'bay']],
    ['>', ['zoom'], 12],
  ],
];

// Power line ref visibility
const power_ref_visible_p = [
  'all',
  [
    'any',
    [
      'all',
      ['>', ['coalesce', ['get', 'voltage'], 0], 330],
      ['>', ['zoom'], 7],
    ],
    [
      'all',
      ['>', ['coalesce', ['get', 'voltage'], 0], 200],
      ['>', ['zoom'], 8],
    ],
    [
      'all',
      ['>', ['coalesce', ['get', 'voltage'], 0], 100],
      ['>', ['zoom'], 9],
    ],
    ['>', ['zoom'], 10],
  ],
  [
    'any',
    ['all', ['!=', ['get', 'line'], 'busbar'], ['!=', ['get', 'line'], 'bay']],
    ['>', ['zoom'], 12],
  ],
];

const construction_label = [
  'case',
  construction_p,
  ' (under construction) ',
  '',
];

const freq = [
  'case',
  hvdc_p,
  ' DC',
  '',
];

const circuits = [
  'case',
  ['all', ['has', 'circuits'], ['>', ['to-number', ['get', 'circuits']], 1]],
  ['concat', ['get', 'circuits'], '×'],
  '',
];

const line_voltage = [
  'case',
  [
    'all',
    ['has', 'voltage_3'],
    ['!=', ['get', 'voltage_3'], ['get', 'voltage_2']],
  ],
  [
    'concat',
    ['get', 'voltage'],
    '/',
    ['get', 'voltage_2'],
    '/',
    ['get', 'voltage_3'],
    ' kV',
  ],
  [
    'all',
    ['has', 'voltage_2'],
    ['!=', ['get', 'voltage_2'], ['get', 'voltage']],
  ],
  ['concat', ['get', 'voltage'], '/', ['get', 'voltage_2'], ' kV'],
  ['has', 'voltage'],
  ['concat', ['get', 'voltage'], ' kV'],
  '',
];

const line_label = [
  'case',
  ['all', ['has', 'voltage'], ['!=', ['get', 'name'], '']],
  [
    'concat',
    ['get', 'name'],
    ' (',
    line_voltage,
    freq,
    ')',
    construction_label,
  ],
  ['has', 'voltage'],
  ['concat', circuits, line_voltage, freq, construction_label],
  ['get', 'name'],
];

const substation_label_detail = [
  'case',
  ['all', ['!=', ['get', 'name'], ''], ['has', 'voltage']],
  [
    'concat',
    ['get', 'name'],
    ' ',
    ['get', 'voltage'],
    ' kV',
    freq,
    construction_label,
  ],
  ['all', ['==', ['get', 'name'], ''], ['has', 'voltage']],
  [
    'concat',
    'Substation ',
    ['get', 'voltage'],
    ' kV',
    freq,
    construction_label,
  ],
  ['get', 'name'],
];

const substation_label = [
  'step',
  ['zoom'],
  ['get', 'name'],
  12,
  substation_label_detail,
];

const layers = [
  {
    zorder: 161,
    id: 'power_substation',
    type: 'fill',
    filter: substation_visible_p,
    source: 'gespot',
    'source-layer': 'power_substation',
    minzoom: 13,
    paint: {
      'fill-opacity': lineOpacity_p,
      'fill-color': voltage_color('voltage'),
      'fill-outline-color': 'rgba(0, 0, 0, 1)',
    },
  },
  {
    zorder: 260,
    id: 'power_line_1',
    type: 'line',
    source: 'gespot',
    'source-layer': 'power_line',
    filter: ['all', ['!', underground_p], power_visible_p],
    minzoom: 0,
    paint: {
      'line-color': voltage_color('voltage'),
      'line-width': voltage_line_thickness,
      'line-offset': voltage_offset(1),
      'line-opacity': lineOpacity_p,
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
  },
  {
    zorder: 260,
    id: 'power_line_2',
    type: 'line',
    source: 'gespot',
    'source-layer': 'power_line',
    filter: [
      'all',
      ['!', underground_p],
      power_visible_p,
      ['has', 'voltage_2'],
    ],
    minzoom: multi_voltage_min_zoom,
    paint: {
      'line-color': voltage_color('voltage_2'),
      'line-width': voltage_line_thickness,
      'line-offset': voltage_offset(2),
      'line-opacity': lineOpacity_p,
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
  },
  {
    zorder: 260,
    id: 'power_line_3',
    type: 'line',
    source: 'gespot',
    'source-layer': 'power_line',
    filter: [
      'all',
      ['!', underground_p],
      power_visible_p,
      ['has', 'voltage_3'],
    ],
    minzoom: multi_voltage_min_zoom,
    paint: {
      'line-color': voltage_color('voltage_3'),
      'line-width': voltage_line_thickness,
      'line-offset': voltage_offset(3),
      'line-opacity': lineOpacity_p,
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
  },
  {
    zorder: 264,
    id: 'power_tower',
    type: 'symbol',
    filter: ['==', ['get', 'type'], 'tower'],
    source: 'gespot',
    'source-layer': 'power_tower',
    minzoom: 13,
    paint: text_paint,
    layout: {
      'icon-image': [
        'case',
        ['get', 'transition'],
        'power_tower_transition',
        'power_tower',
      ],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.4, 17, 1],
      'text-field': '{ref}',
      'text-size': [
        'step',
        // Set visibility by using size
        ['zoom'],
        0,
        14,
        10,
      ],
      'text-offset': [0, 1.5],
      'text-max-angle': 10,
    },
  },
  {
    zorder: 265,
    id: 'power_pole',
    type: 'symbol',
    filter: ['==', ['get', 'type'], 'pole'],
    source: 'gespot',
    'source-layer': 'power_tower',
    minzoom: 14,
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
    zorder: 268,
    id: 'power_substation_point',
    type: 'circle',
    filter: ['all', substation_visible_p, substation_point_visible_p],
    source: 'gespot',
    'source-layer': 'power_substation_point',
    minzoom: 5,
    layout: {},
    paint: {
      'circle-radius': substation_radius,
      'circle-color': voltage_color('voltage'),
      'circle-stroke-color': '#333',
      'circle-stroke-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        0,
        6,
        0.1,
        8,
        0.5,
        15,
        1,
      ],
      'circle-opacity': lineOpacity_p,
      'circle-stroke-opacity': lineOpacity_p,
    },
  },
  {
    zorder: 560,
    id: 'power_line_ref',
    type: 'symbol',
    filter: [
      'all',
      power_ref_visible_p,
      ['!=', ['coalesce', ['get', 'ref'], ''], ''],
      ['<', ['length', ['get', 'ref']], 5],
    ],
    source: 'gespot',
    'source-layer': 'power_line',
    minzoom: 7,
    layout: {
      'icon-image': 'power_line_ref',
      'text-field': '{ref}',
      'symbol-placement': 'line-center',
      'text-size': 10,
      'text-max-angle': 10,
    },
  },
  {
    zorder: 561,
    id: 'power_line_label',
    type: 'symbol',
    filter: ['all', power_visible_p],
    source: 'gespot',
    'source-layer': 'power_line',
    minzoom: 11,
    paint: text_paint,
    layout: {
      'text-field': line_label,
      'symbol-placement': 'line',
      'symbol-spacing': 400,
      'text-size': 10,
      'text-offset': [
        'case',
        ['has', 'voltage_3'],
        ['literal', [0, 1.5]],
        ['has', 'voltage_2'],
        ['literal', [0, 1.25]],
        ['literal', [0, 1]],
      ],
      'text-max-angle': 10,
    },
  },
  {
    zorder: 562,
    id: 'power_substation_ref_label',
    type: 'symbol',
    source: 'gespot',
    'source-layer': 'power_substation_point',
    minzoom: 14.5,
    layout: {
      'symbol-z-order': 'source',
      'text-field': '{ref}',
      'text-anchor': 'bottom',
      'text-offset': [0, -0.5],
      'text-size': ['interpolate', ['linear'], ['zoom'], 14, 9, 18, 12],
      'text-max-width': 8,
    },
    paint: text_paint,
  },
  {
    zorder: 562,
    id: 'power_substation_label',
    type: 'symbol',
    source: 'gespot',
    filter: substation_label_visible_p,
    'source-layer': 'power_substation_point',
    minzoom: 8,
    maxzoom: 24,
    layout: {
      'symbol-sort-key': ['-', 10000, ['get', 'voltage']],
      'symbol-z-order': 'source',
      'text-field': substation_label,
      'text-anchor': 'top',
      'text-offset': [0, 0.5],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        10,
        18,
        [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'voltage'], 0],
          0,
          10,
          400,
          16,
        ],
      ],
      'text-max-width': 8,
    },
    paint: text_paint,
  }
];

export {layers as default, voltage_scale, special_voltages};
