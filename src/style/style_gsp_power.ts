import { DataDrivenPropertyValueSpecification, ExpressionSpecification } from 'maplibre-gl'
import { LayerSpecificationWithZIndex } from './types.js'
import {scale_color, text_paint, construction_p, underground_p, poleRadius_p, materialColor_scale, lineOpacity_p, font, local_name} from './common.js';

const voltage_scale: [number | null, string][] = [
  [null, '#7A7A85'],
  [10, '#6E97B8'],
  [25, '#55B555'],
  [52, '#B59F10'],
  [132, '#B55D00'],
  [220, '#C73030'],
  [310, '#B54EB2'],
  [550, '#00C1CF']
]

const warning_scale = {
  "DMA":"#DD0000",
  "DLVR":"#ffc107",
  "DLVS":"#ffc107",
  "DLI":"#17a2b8"
};

const powerColor = '#d00000';
const powerTextPaint = Object.assign({
  "text-color":powerColor
}, text_paint);

const special_voltages = {
  HVDC: '#4E01B5',
  'Traction (<50 Hz)': '#A8B596',
};

// Power utility predicates
const utilityPower_p: ExpressionSpecification = [
  'all',
  ['==', ['get', 'utility'], 'power'],
];

// === Frequency predicates
const traction_freq_p: ExpressionSpecification = [
  'all',
  ['has', 'frequency'],
  ['!=', ['get', 'frequency'], ''],
  ['!=', ['to-number', ['get', 'frequency']], 50],
  ['!=', ['to-number', ['get', 'frequency']], 60]
]

const hvdc_p: ExpressionSpecification = [
  'all',
  ['has', 'frequency'],
  ['!=', ['get', 'frequency'], ''],
  ['==', ['to-number', ['get', 'frequency']], 0]
]

// Stepwise function to assign colour by voltage:
function voltage_color(field: string): DataDrivenPropertyValueSpecification<string> {
  const voltage_func: any = ['step', ['to-number', ['coalesce', ['get', field], 0]]]
  for (const row of voltage_scale) {
    if (row[0] == null) {
      voltage_func.push(row[1])
      continue
    }
    voltage_func.push(row[0] - 0.01)
    voltage_func.push(row[1])
  }

  return [
    'case',
    hvdc_p,
    special_voltages['HVDC'], // HVDC (frequency == 0)
    traction_freq_p,
    special_voltages['Traction (<50 Hz)'], // Traction power
    voltage_func as ExpressionSpecification
  ]
}

const multi_voltage_min_zoom = 10;

// Generate an expression to determine the offset of a power line
// segment with multiple voltages
function voltage_offset(index: number): DataDrivenPropertyValueSpecification<number> {
  const spacing = 7

  const offset = (index - 1) * spacing
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    multi_voltage_min_zoom - 0.001,
    0,
    multi_voltage_min_zoom,
    [
      'case',
      ['has', 'voltage_3'],
      (offset - spacing) * 0.5,
      ['has', 'voltage_2'],
      (offset - spacing / 2) * 0.5,
      0
    ],
    13,
    ['case', ['has', 'voltage_3'], offset - spacing, ['has', 'voltage_2'], offset - spacing / 2, 0]
  ]
}

// Function to assign power line thickness.
// Interpolate first by zoom level and then by voltage.
const voltage_line_thickness: ExpressionSpecification = [
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
    ['interpolate', ['linear'], ['coalesce', ['get', 'voltage'], 0], 0, 1, 100, 1.8, 800, 4]
  ]
]

const voltage:DataDrivenPropertyValueSpecification<number> = ['to-number', ['coalesce', ['get', 'voltage'], 0]];
const circuits:DataDrivenPropertyValueSpecification<number> = ['to-number', ['coalesce', ['get', 'circuits'], 1]];

// Determine substation visibility
const substation_visible_p: ExpressionSpecification = [
  'all',
  [
    'any',
    ['>', voltage, 200],
    [
      'all',
      ['>', voltage, 200],
      ['>', ['zoom'], 6],
    ],
    [
      'all',
      ['>', voltage, 100],
      ['>', ['zoom'], 7],
    ],
    ['all', ['>', voltage, 25], ['>', ['zoom'], 9]],
    ['all', ['>', voltage, 9], ['>', ['zoom'], 10]],
    ['>', ['zoom'], 11],
  ],
  ['!=', ['get', 'substation'], 'transition'],
];

const substation_radius: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  5,
  ['interpolate', ['linear'], voltage, 0, 0, 200, 1, 750, 3],
  12,
  ['interpolate', ['linear'], voltage, 10, 1, 30, 3, 100, 5, 300, 7, 600, 9],
  15,
  3
]

// Determine the minimum zoom a point is visible at (before it can be seen as an
// area), based on the area of the substation.
const substation_point_visible_p: ExpressionSpecification = [
  'any',
  ['==', ['coalesce', ['get', 'area'], 0], 0], // Area = 0 - mapped as node
  ['all', ['<', ['coalesce', ['get', 'area'], 0], 100], ['<', ['zoom'], 16]],
  ['all', ['<', ['coalesce', ['get', 'area'], 0], 250], ['<', ['zoom'], 15]],
  ['<', ['zoom'], 13],
];

const substation_label_visible_p: ExpressionSpecification = [
  'all',
  [
    'any',
    ['>', voltage, 399],
    [
      'all',
      ['>', voltage, 200],
      ['>', ['zoom'], 8],
    ],
    [
      'all',
      ['>', voltage, 100],
      ['>', ['zoom'], 10],
    ],
    [
      'all',
      ['>', voltage, 50],
      ['>', ['zoom'], 12],
    ],
    ['>', ['zoom'], 13],
  ],
  ['any', ['==', ['to-number', ['get', 'area']], 0], ['<', ['zoom'], 17]],
  ['!=', ['get', 'substation'], 'transition'],
];

// Power line / substation visibility
const power_visible_p: ExpressionSpecification = [
  'all',
  ['!', underground_p],
  [
    'any',
    ['>', voltage, 199],
    ['all', ['>', voltage, 99], ['>=', ['zoom'], 4]],
    ['all', ['>', voltage, 49], ['>=', ['zoom'], 5]],
    ['all', ['>', voltage, 24], ['>=', ['zoom'], 6]],
    ['all', ['>', voltage, 9], ['>=', ['zoom'], 9]],
    ['>', ['zoom'], 10],
  ],
  [
    'any',
    ['all', ['!=', ['get', 'line'], 'busbar'], ['!=', ['get', 'line'], 'bay']],
    ['>', ['zoom'], 12],
  ],
];

const construction_label: ExpressionSpecification = [
  'case',
  construction_p,
  ' (under construction) ',
  '',
];

const freq: ExpressionSpecification = [
  'case',
  hvdc_p,
  ' DC',
  traction_freq_p,
  ['concat', ' ', ['get', 'frequency'], ' Hz'],
  '',
];

function round(field: ExpressionSpecification, places: number): ExpressionSpecification {
  const pow = Math.pow(10, places)
  return ['/', ['round', ['*', field, pow]], pow]
}

const line_voltage: ExpressionSpecification = [
  'case',
  ['all', ['has', 'voltage_3'], ['!=', ['get', 'voltage_3'], ['get', 'voltage_2']]],
  [
    'concat',
    round(['get', 'voltage'], 3),
    '/',
    round(['get', 'voltage_2'], 3),
    '/',
    round(['get', 'voltage_3'], 3),
    ' kV'
  ],
  ['all', ['has', 'voltage_2'], ['!=', ['get', 'voltage_2'], ['get', 'voltage']]],
  ['concat', round(['get', 'voltage'], 3), '/', round(['get', 'voltage_2'], 3), ' kV'],
  ['has', 'voltage'],
  ['concat', round(['get', 'voltage'], 3), ' kV'],
  ''
]

const warningWidth = function (warning: string): ExpressionSpecification{
  let widthFunc: DataDrivenPropertyValueSpecification<number> = ['case',true,50,50];
  
  switch(warning){
    case "DMA":
      widthFunc = ['case',
      ['<', voltage, 1],
      ['*', circuits, 0.3],
      [
        'all',
        ['<', voltage, 50],
        ['>=', voltage, 1]
      ],
      ['*', circuits, 2],
      [
        'all',
        ['<', voltage, 250],
        ['>=', voltage, 50]
      ],
      ['*', circuits, ['+', ['/', voltage, 100], 3]],
      ['*', circuits, ['+', ['/', voltage, 100], 4]]];
      break;
  
    case "DLVR":
      widthFunc = ['case',
      ['<', voltage, 1],
      ['*', circuits, 0.3],
      [
        'all',
        ['<', voltage, 50],
        ['>=', voltage, 1]
      ],
      ['*', circuits, 4],
      [
        'all',
        ['<', voltage, 250],
        ['>=', voltage, 50]
      ],
      ['*', circuits, ['+', ['/', voltage, 100], 4]],
      ['*', circuits, ['+', ['/', voltage, 100], 5]]];
      break;

    case "DLVS":
      widthFunc = ['case',
      ['<', voltage, 1],
      ['*', circuits, 3],
      [
        'all',
        ['<', voltage, 50],
        ['>=', voltage, 1]
      ],
      ['*', circuits, 5],
      [
        'all',
        ['<', voltage, 250],
        ['>=', voltage, 50]
      ],
      ['*', circuits, ['+', ['/', voltage, 100], 6]],
      ['*', circuits, ['+', ['/', voltage, 100], 6]]];
      break;
  }

  const result: ExpressionSpecification = [
    'interpolate', 
    ['exponential', 2], 
    ['zoom'],
    10, ["*", widthFunc, 2, ["^", 2, -6]], 
    24, ["*", widthFunc, 2, ["^", 2, 8]]
  ];

  return result;
}

const line_label: ExpressionSpecification = [
  'case',
  ['all', ['has', 'voltage'], ['has', 'name'], ['!=', local_name, '']],
  ['concat', local_name, ' (', line_voltage, freq, ')', construction_label],
  ['has', 'voltage'],
  ['concat', line_voltage, freq, construction_label],
  local_name
]

const substation_label_detail: ExpressionSpecification = [
  'case',
  ['all', ['!=', ['get', 'name'], ''], ['has', 'voltage']],
  [
    'concat',
    ['get', 'name'],
    ' ',
    voltage,
    ' kV',
    freq,
    construction_label,
  ],
  ['all', ['==', ['get', 'name'], ''], ['has', 'voltage']],
  [
    'concat',
    'Substation ',
    voltage,
    ' kV',
    freq,
    construction_label,
  ],
  ['get', 'name'],
];

const substation_label: ExpressionSpecification = [
  'step',
  ['zoom'],
  ['get', 'name'],
  12,
  substation_label_detail,
];

const layers: LayerSpecificationWithZIndex[] = [
  {
    zorder: 200,
    id: 'power_line_warning',
    type: 'line',
    source: 'gespot',
    'source-layer': 'power_line',
    filter: power_visible_p,
    minzoom: 10,
    paint: {
      'line-color': warning_scale["DMA"],
      'line-width': warningWidth("DMA"),
      'line-opacity': 0.25,
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    }
  },
  {
    zorder: 260,
    id: 'power_line_1',
    type: 'line',
    source: 'gespot',
    'source-layer': 'power_line',
    filter: power_visible_p,
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
    }
  },
  {
    zorder: 260,
    id: 'power_line_2',
    type: 'line',
    source: 'gespot',
    'source-layer': 'power_line',
    filter: [
      'all',
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
    }
  },
  {
    zorder: 260,
    id: 'power_line_3',
    type: 'line',
    source: 'gespot',
    'source-layer': 'power_line',
    filter: [
      'all',
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
    }
  },
  {
    zorder: 301,
    id: 'power_tower',
    type: 'symbol',
    filter: ['==', ['get', 'type'], 'tower'],
    source: 'gespot',
    'source-layer': 'power_tower',
    minzoom: 10,
    paint: Object.assign({
      "icon-halo-width":3,
      "icon-halo-color":powerColor
    }, powerTextPaint),
    layout: {
      'icon-image': [
        'case',
        ['get', 'transition'],
        'power_tower_transition',
        'power_tower',
      ],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.4, 17, 1],
      'text-field': '{ref}',
      'text-font':font,
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
    }
  },
  {
    zorder: 305,
    id: 'power_pole_symbol',
    type: 'symbol',
    source: 'gespot',
    filter: [
      'all',
      utilityPower_p,
      ['==', ['get', 'type'], 'pole']
    ],
    minzoom: 11,
    maxzoom:14.5,
    'source-layer': 'power_tower',
    paint: powerTextPaint,
    layout: {
      'icon-image': [
        'case',
        ['get', 'transition'],
        'power_pole_transition',
        'power_pole',
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
        10,
      ],
      'text-offset': [0, 1],
      'text-max-angle': 10,
    }
  },
  {
    zorder: 306,
    id: 'power_pole_point',
    type: 'circle',
    source: 'gespot',
    filter: [
      'all',
      utilityPower_p,
      ['==', ['get', 'type'], 'pole']
    ],
    minzoom: 14.5,
    'source-layer': 'power_tower',
    paint: {
      'circle-radius': poleRadius_p,
      'circle-color': scale_color("material", materialColor_scale),
      'circle-stroke-color': powerColor,
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
    id: 'power_pole_label',
    type: 'symbol',
    source: 'gespot',
    filter: [
      'all',
      utilityPower_p,
      ['==', ['get', 'type'], 'pole']
    ],
    minzoom: 14.5,
    'source-layer': 'power_tower',
    paint: powerTextPaint,
    layout: {
      'text-field': '{ref}',
      'text-font':font,
      'text-size': ['interpolate', ['linear'], ['zoom'], 11, 0, 12, 0, 12.01, 10],
      'text-offset': [0, 1],
      'text-anchor': 'top',
    }
  },
  {
    zorder: 101,
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
    }
  },
  {
    zorder: 102,
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
    }
  },
  {
    zorder: 560,
    id: 'power_line_ref',
    type: 'symbol',
    filter: [
      'all',
      power_visible_p,
      ['!=', ['coalesce', ['get', 'ref'], ''], ''],
      ['<', ['length', ['get', 'ref']], 5],
    ],
    source: 'gespot',
    'source-layer': 'power_line',
    minzoom: 7,
    layout: {
      'icon-image': 'power_line_ref',
      'text-field': '{ref}',
      'text-font':font,
      'symbol-placement': 'line-center',
      'text-size': 10,
      'text-max-angle': 10,
    }
  },
  {
    zorder: 561,
    id: 'power_line_label',
    type: 'symbol',
    filter: power_visible_p,
    source: 'gespot',
    'source-layer': 'power_line',
    minzoom: 11,
    paint: text_paint,
    layout: {
      'text-field': line_label,
      'symbol-placement': 'line',
      'symbol-spacing': 400,
      'text-font':font,
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
    }
  },
  {
    zorder: 562,
    id: 'power_substation_ref_label',
    type: 'symbol',
    filter: substation_label_visible_p,
    source: 'gespot',
    'source-layer': 'power_substation_point',
    minzoom: 14.5,
    layout: {
      'symbol-z-order': 'source',
      'text-field': '{ref}',
      'text-font':font,
      'text-anchor': 'bottom',
      'text-offset': [0, -0.5],
      'text-size': ['interpolate', ['linear'], ['zoom'], 14, 9, 18, 12],
      'text-max-width': 8,
    },
    paint: text_paint
  },
  {
    zorder: 562,
    id: 'power_substation_label',
    type: 'symbol',
    source: 'gespot',
    filter: substation_label_visible_p,
    'source-layer': 'power_substation_point',
    minzoom: 8,
    layout: {
      'symbol-sort-key': ['-', 10000, voltage],
      'symbol-z-order': 'source',
      'text-field': substation_label,
      'text-font':font,
      'text-anchor': 'top',
      'text-offset': [0, 0.5],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        10,
        18,
        ['interpolate', ['linear'], voltage, 0, 10, 400, 16]
      ],
      'text-max-width': 8,
    },
    paint: text_paint
  }
];

export {layers as powerLayers, voltage_scale, warning_scale as warningAreas_filters, special_voltages, powerColor, warningWidth};
