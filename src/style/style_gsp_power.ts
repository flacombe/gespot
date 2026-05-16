import { t } from 'i18next'
import {
  text_paint,
  underground_p,
  indoor_p,
  font,
  get_local_name,
  oimSymbol,
  construction_p,
  disused_p,
  lifecycle_label,
  poleRadius_p,
  materialColor_scale,
  scale_color
} from './common.js'
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
import { LayerSpecificationWithZIndex } from './types.ts'
import { DataDrivenPropertyValueSpecification, ExpressionSpecification } from 'maplibre-gl'

export const powerColor = '#d00000';
const powerTextPaint = Object.assign({
  "text-color":powerColor
}, text_paint);

export const voltage_scale: [number | null, string][] = [
  [null, '#7A7A85'],
  [10, '#6E97B8'],
  [25, '#55B555'],
  [52, '#B59F10'],
  [132, '#B55D00'],
  [220, '#C73030'],
  [310, '#B54EB2'],
  [550, '#00C1CF']
]

export const special_voltages = {
  hvdc: '#4E01B5',
  traction: '#A8B596'
}

export const hazard_scale = {
  "DMA":"#DD0000",
  "DLVR":"#ffc107",
  "DLVS":"#ffc107",
  "DLI":"#17a2b8"
};

// Power utility predicates
const utilityPower_p: ExpressionSpecification = ['==', ['get', 'utility'], 'power'];

// Zoom level at which substation labels switch from centroid to outline placement.
const substation_label_switch_zoom = 16;
const multi_voltage_min_zoom = 10;

// Insulation predicate
const insulated_p: ExpressionSpecification = ['==', ['get', 'type'], 'cable'];

// Frequency predicates
const traction_freq_p: ExpressionSpecification = all(
  has('frequency'),
  ['!=', get('frequency'), ''],
  ['!=', ['to-number', get('frequency')], 50],
  ['!=', ['to-number', get('frequency')], 60]
)

const hvdc_p: ExpressionSpecification = all(
  has('frequency'),
  ['!=', get('frequency'), ''],
  ['==', ['to-number', get('frequency')], 0]
)

// Stepwise function to assign colour by voltage:
function voltage_color(field: string): DataDrivenPropertyValueSpecification<string> {
  const voltage_func: any = ['step', ['to-number', coalesce(get(field), 0)]]
  for (const row of voltage_scale) {
    if (row[0] == null) {
      voltage_func.push(row[1])
      continue
    }
    voltage_func.push(row[0] - 0.01)
    voltage_func.push(row[1])
  }

  return case_(
    [
      [hvdc_p, special_voltages.hvdc], // HVDC (frequency == 0)
      [traction_freq_p, special_voltages.traction] // Traction power
    ],
    voltage_func as ExpressionSpecification
  )
}

// Generate an expression to determine the offset of a power line
// segment with multiple voltages
function voltage_offset(index: number): DataDrivenPropertyValueSpecification<number> {
  const spacing = 14

  const offset = (index - 1) * spacing
  return interpolate(zoom, [
    [multi_voltage_min_zoom - 0.001, 0],
    [
      multi_voltage_min_zoom,
      case_(
        [
          [has('voltage_3'), (offset - spacing) * 0.3],
          [has('voltage_2'), (offset - spacing / 2) * 0.3]
        ],
        0
      )
    ],
    [
      21,
      case_(
        [
          [has('voltage_3'), offset - spacing],
          [has('voltage_2'), offset - spacing / 2]
        ],
        0
      )
    ]
  ])
}

// Function to assign power line thickness.
// Interpolate first by zoom level and then by voltage.
const voltage_line_thickness: ExpressionSpecification = interpolate(
  zoom,
  [
    [1, 0.5],
    [
      20,
      match(
        get('line'),
        [
          ['bay', 2],
          ['busbar', 2.5]
        ],
        interpolate(coalesce(get('voltage'), 0), [
          [0, 1.5],
          [20, 2],
          [30, 4],
          [100, 5],
          [500, 7]
        ])
      )
    ]
  ],
  1.1
)

const voltage: ExpressionSpecification = ['to-number', coalesce(get('voltage'), 0)]
const circuits:DataDrivenPropertyValueSpecification<number> = ['to-number', ['coalesce', ['get', 'circuits'], 1]]
const output: ExpressionSpecification = ['to-number', coalesce(get('output'), 0)]
const area: ExpressionSpecification = ['to-number', coalesce(get('area'), 0)]

const substation_radius: ExpressionSpecification = interpolate(zoom, [
  [
    5.5,
    interpolate(voltage, [
      [0, 0],
      [200, 1],
      [750, 3]
    ])
  ],
  [
    13,
    interpolate(voltage, [
      [10, 1],
      [30, 3],
      [100, 4],
      [500, 8]
    ])
  ],
  [20, 8]
])

// Determine the minimum zoom a point is visible at (before it can be seen as an
// area), based on the area of the substation.
const substation_point_visible_p: ExpressionSpecification = any(
  ['==', area, 0], // Area = 0 - mapped as node
  all(['<', area, 100], ['<', zoom, 16]),
  all(['<', area, 250], ['<', zoom, 15]),
  ['<', zoom, 13]
)

const converter_p: ExpressionSpecification = all(
  ['==', get('substation'), 'converter'],
  any(['>', voltage, 100], ['>', zoom, 6])
)

const substation_label_visible_p: ExpressionSpecification = all(
  any(
    ['>', voltage, 399],
    all(['>', voltage, 200], ['>', zoom, 8]),
    all(['>', voltage, 100], ['>', zoom, 10]),
    all(['>', voltage, 50], ['>', zoom, 12]),
    ['>', zoom, 13]
  ),
  any(['==', area, 0], ['<', zoom, substation_label_switch_zoom]),
  ['!=', get('substation'), 'transition']
)

// Power line / substation visibility
const power_visible_p: ExpressionSpecification = all(
  not(underground_p),
  not(indoor_p),
  any(
    ['>', voltage, 199],
    all(['>', voltage, 99], ['>=', ['zoom'], 4]),
    all(['>', voltage, 49], ['>=', ['zoom'], 5]),
    all(['>', voltage, 24], ['>=', ['zoom'], 6]),
    all(['>', voltage, 9], ['>=', ['zoom'], 9]),
    ['>', ['zoom'], 10],
  ),
  any(
    all(['!=', ['get', 'line'], 'busbar'], ['!=', ['get', 'line'], 'bay']),
    ['>', ['zoom'], 12],
  )
);
const substation_visible_p: ExpressionSpecification = all(
  not(underground_p),
  any(
    ['>', voltage, 200],
    all(['>', voltage, 200], ['>', zoom, 6]),
    all(['>', voltage, 100], ['>', zoom, 7]),
    all(['>', voltage, 9], ['>', zoom, 10]),
    ['>', zoom, 10.5]
  ),
  any(['!=', get('substation'), 'transition'], ['>', zoom, 12])
)

// Power line ref visibility
const power_ref_visible_p: ExpressionSpecification = all(
  any(
    all(['>', voltage, 330], ['>', zoom, 7]),
    all(['>', voltage, 200], ['>', zoom, 8]),
    all(['>', voltage, 100], ['>', zoom, 9]),
    ['>', zoom, 10]
  ),
  any(all(['!=', get('line'), 'busbar'], ['!=', get('line'), 'bay']), ['>', zoom, 12])
)

const power_opacity: ExpressionSpecification = interpolate(zoom, [
  [4, case_([[construction_p, 0.3]], 0.6)],
  [8, case_([[construction_p, 0.3]], 1)]
])

export const hazardWidth = function (hazard: string): ExpressionSpecification{
  let widthFunc: DataDrivenPropertyValueSpecification<number> = ['case',true,50,50];
  
  switch(hazard){
    case "DMA":
      widthFunc = ['case',
      insulated_p,
      0.5,
      ['<', voltage, 1],
      ['*', circuits, 0.3],
      all(
        ['<', voltage, 50],
        ['>=', voltage, 1]
      ),
      ['*', circuits, 2],
      all(
        ['<', voltage, 250],
        ['>=', voltage, 50]
      ),
      ['*', circuits, ['+', ['/', voltage, 100], 3]],
      ['*', circuits, ['+', ['/', voltage, 100], 4]]];
      break;
  
    case "DLVR":
      widthFunc = ['case',
      insulated_p,
      0,
      ['<', voltage, 1],
      ['*', circuits, 0.3],
      all(
        ['<', voltage, 50],
        ['>=', voltage, 1]
      ),
      ['*', circuits, 4],
      all(
        ['<', voltage, 250],
        ['>=', voltage, 50]
      ),
      ['*', circuits, ['+', ['/', voltage, 100], 4]],
      ['*', circuits, ['+', ['/', voltage, 100], 5]]];
      break;

    case "DLVS":
      widthFunc = ['case',
      insulated_p,
      0,
      ['<', voltage, 1],
      ['*', circuits, 3],
      all(
        ['<', voltage, 50],
        ['>=', voltage, 1]
      ),
      ['*', circuits, 5],
      all(
        ['<', voltage, 250],
        ['>=', voltage, 50]
      ),
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

export default function layers(): LayerSpecificationWithZIndex[] {
  const local_name = get_local_name()

  const freq: ExpressionSpecification = case_(
    [
      [hvdc_p, ' DC'],
      [traction_freq_p, concat(' ', get('frequency'), ' ' + t('units.Hz', 'Hz'))]
    ],
    ''
  )

  // Render voltage to text in V or kV
  const voltage_label: ExpressionSpecification = if_(
    ['<', voltage, 1],
    concat(round(['*', get('voltage'), 1000], 3), ' ' + t('units.V', 'V')),
    concat(round(get('voltage'), 3), ' ' + t('units.kV', 'kV'))
  )

  const line_voltage: ExpressionSpecification = case_(
    [
      [
        all(has('voltage_3'), ['!=', get('voltage_3'), get('voltage_2')]),
        concat(
          round(get('voltage'), 3),
          '/',
          round(get('voltage_2'), 3),
          '/',
          round(get('voltage_3'), 3),
          ' ' + t('units.kV', 'kV')
        )
      ],
      [
        all(has('voltage_2'), ['!=', get('voltage_2'), get('voltage')]),
        concat(round(get('voltage'), 3), '/', round(get('voltage_2'), 3), ' ' + t('units.kV', 'kV'))
      ],
      [has('voltage'), voltage_label]
    ],
    ''
  )

  const transformer_label: ExpressionSpecification = concat(
    if_(
      has('voltage_primary'),
      concat(
        round(['to-number', get('voltage_primary')], 3),
        if_(has('voltage_secondary'), concat('/', round(['to-number', get('voltage_secondary')], 3)), ''),
        if_(has('voltage_tertiary'), concat('/', round(['to-number', get('voltage_tertiary')], 3)), ''),
        ' kV'
      ),
      ''
    ),
    if_(has('rating'), concat('\n', get('rating')), '')
  )

  const line_label: ExpressionSpecification = case_(
    [
      [
        all(has('voltage'), has('name'), ['!=', local_name, '']),
        concat(local_name, ' (', line_voltage, freq, ')', lifecycle_label())
      ],
      [has('voltage'), concat(line_voltage, freq, lifecycle_label())]
    ],
    local_name
  )

  const substation_label_detail: ExpressionSpecification = case_(
    [
      [
        all(['!=', local_name, ''], has('voltage')),
        concat(local_name, ' ', voltage, ' ' + t('units.kV', 'kV'), freq, lifecycle_label())
      ],
      [
        all(['==', local_name, ''], has('voltage')),
        concat('Substation ', voltage, ' ' + t('units.kV', 'kV'), freq, lifecycle_label())
      ]
    ],
    local_name
  )

  const substation_label: ExpressionSpecification = step(zoom, local_name, [[12, substation_label_detail]])

  return [
    {
      zorder: 200,
      id: 'power_line_hazard',
      type: 'line',
      source: 'gespot',
      'source-layer': 'power_line',
      filter: power_visible_p,
      minzoom: 10,
      paint: {
        'line-color': hazard_scale["DMA"],
        'line-width': hazardWidth("DMA"),
        'line-opacity': 0.25,
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      }
    },
    {
      zorder: 161,
      id: 'power_substation',
      type: 'fill',
      filter: substation_visible_p,
      source: 'gespot',
      'source-layer': 'power_substation',
      minzoom: 13,
      paint: {
        'fill-opacity': 0.3,
        'fill-color': voltage_color('voltage')
      }
    },
    {
      zorder: 162,
      id: 'power_substation_outline',
      type: 'line',
      filter: substation_visible_p,
      source: 'gespot',
      'source-layer': 'power_substation',
      minzoom: 13,
      paint: {
        'line-color': rgb(30, 30, 30),
        'line-opacity': 0.8,
        'line-width': interpolate(zoom, [
          [13, 0.5],
          [20, 4]
        ])
      }
    },
    {
      zorder: 259,
      id: 'power_line_disused',
      type: 'line',
      source: 'gespot',
      'source-layer': 'power_line',
      filter: all(power_visible_p, disused_p),
      minzoom: 10,
      paint: {
        'line-color': '#999999',
        'line-width': 2,
        'line-opacity': power_opacity
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      }
    },
    {
      zorder: 260,
      id: 'power_line_1',
      type: 'line',
      source: 'gespot',
      'source-layer': 'power_line',
      filter: all(power_visible_p, not(disused_p)),
      minzoom: 0,
      paint: {
        'line-color': voltage_color('voltage'),
        'line-width': voltage_line_thickness,
        'line-offset': voltage_offset(1),
        'line-opacity': power_opacity
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      }
    },
    {
      zorder: 260,
      id: 'power_line_2',
      type: 'line',
      source: 'gespot',
      'source-layer': 'power_line',
      filter: all(power_visible_p, has('voltage_2'), not(disused_p)),
      minzoom: multi_voltage_min_zoom,
      paint: {
        'line-color': voltage_color('voltage_2'),
        'line-width': voltage_line_thickness,
        'line-offset': voltage_offset(2),
        'line-opacity': power_opacity
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      }
    },
    {
      zorder: 260,
      id: 'power_line_3',
      type: 'line',
      source: 'gespot',
      'source-layer': 'power_line',
      filter: all(power_visible_p, has('voltage_3'), not(disused_p)),
      minzoom: multi_voltage_min_zoom,
      paint: {
        'line-color': voltage_color('voltage_3'),
        'line-width': voltage_line_thickness,
        'line-offset': voltage_offset(3),
        'line-opacity': power_opacity
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      }
    },
    {
      zorder: 263,
      id: 'power_portal_way',
      type: 'line',
      source: 'gespot',
      'source-layer': 'power_portal_way',
      minzoom: 14,
      layout: {
        'line-join': 'bevel',
        'line-cap': 'square'
      },
      paint: {
        'line-color': '#444',
        'line-width': interpolate(zoom, [
          [14, 2],
          [20, 6]
        ])
      }
    },
    {
      zorder: 265,
      id: 'power_portal_node',
      type: 'symbol',
      filter: ['==', get('type'), 'portal'],
      source: 'gespot',
      'source-layer': 'power_tower',
      minzoom: 14,
      layout: {
        'icon-image': 'power_portal',
        'icon-allow-overlap': true,
        'icon-size': interpolate(zoom, [
          [14, 0.3],
          [20, 1]
        ]),
        'icon-rotate': ['get', 'angle']
      }
    },
    {
      zorder: 266,
      id: 'power_pole_transformer',
      type: 'symbol',
      filter: any(has('transformer'), has('substation')),
      source: 'gespot',
      'source-layer': 'power_tower',
      minzoom: 14,
      layout: {
        'icon-image': 'power_transformer',
        'icon-offset': [10, 0],
        'icon-anchor': 'left',
        'icon-size': interpolate(zoom, [
          [14, 0.3],
          [20, 1]
        ]),
        'icon-allow-overlap': true
      }
    },
    {
      zorder: 266,
      id: 'power_pole_switch',
      type: 'symbol',
      filter: has('switch'),
      source: 'gespot',
      'source-layer': 'power_tower',
      minzoom: 14,
      layout: {
        'icon-image': match(
          get('switch'),
          [
            ['disconnector', 'power_switch_disconnector'],
            ['mechanical', 'power_switch'],
            ['circuit_breaker', 'power_switch_circuit_breaker']
          ],
          'power_switch'
        ),
        'icon-rotate': 90,
        'icon-offset': match(get('type'), [['tower', literal([0, -30])]], literal([0, -20])),
        'icon-size': interpolate(zoom, [
          [14, 0.3],
          [20, 1]
        ]),
        'icon-allow-overlap': true
      }
    },
    {
      zorder: 266,
      id: 'power_pole_transition',
      type: 'symbol',
      filter: all(utilityPower_p, ['==', ['get', 'type'], 'pole'], get('transition')),
      source: 'gespot',
      'source-layer': 'power_tower',
      minzoom: 14.5,
      layout: {
        'icon-image': 'power_pole_transition',
        'icon-offset': literal([-20, 0]),
        'icon-size': interpolate(zoom, [
          [14, 0.3],
          [20, 1]
        ]),
        'icon-allow-overlap': true
      }
    },
    {
      zorder: 268,
      id: 'power_substation_point',
      type: 'circle',
      filter: all(substation_visible_p, substation_point_visible_p, not(converter_p)),
      source: 'gespot',
      'source-layer': 'power_substation_point',
      minzoom: 5,
      layout: {},
      paint: {
        'circle-radius': substation_radius,
        'circle-color': voltage_color('voltage'),
        'circle-stroke-color': ['interpolate-hcl', ['linear'], zoom, 8, '#eee', 12, '#333'],
        'circle-stroke-width': interpolate(zoom, [
          [5, 0],
          [8, 0.5],
          [20, 2]
        ]),
        'circle-opacity': power_opacity,
        'circle-stroke-opacity': power_opacity
      }
    },
    {
      zorder: 301,
      id: 'power_tower',
      type: 'symbol',
      filter: all(utilityPower_p, ['==', get('type'), 'tower']),
      source: 'gespot',
      'source-layer': 'power_tower',
      minzoom: 11,
      layout: {
        'icon-image': case_([[get('transition'), 'power_tower_transition']], 'power_tower'),
        'icon-allow-overlap': true,
        'icon-size': interpolate(
          zoom,
          [
            [13, 0.5],
            [21, 1.5]
          ],
          1.2
        ),
        'icon-rotate': ['-', ['get', 'angle'], 180],
        'text-field': step(zoom, '', [[14, get('ref')]]),
        'text-font': font,
        'text-size': interpolate(zoom, [
          [13, 8],
          [21, 14]
        ]),
        'text-optional': true,
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 1
      },
      paint: text_paint
    },
    {
      zorder: 302,
      id: 'power_terminal',
      type: 'symbol',
      filter: all(utilityPower_p, ['==', get('type'), 'terminal']),
      source: 'gespot',
      'source-layer': 'power_tower',
      minzoom: 12,
      layout: {
        'icon-image': 'power_terminal',
        'icon-allow-overlap': true,
        'icon-size': interpolate(
          zoom,
          [
            [13, 1],
            [21, 2]
          ],
          1.2
        )
      }
    },
    {
      zorder: 305,
      id: 'power_pole_symbol',
      type: 'symbol',
      filter: all(utilityPower_p, ['==', get('type'), 'pole']),
      source: 'gespot',
      'source-layer': 'power_tower',
      minzoom: 10.5,
      maxzoom: 14.5,
      paint: {
        ...powerTextPaint,
        'icon-opacity': interpolate(zoom, [
          [10.5, 0],
          [11.5, 1]
        ])
      },
      layout: {
        'icon-image': case_([[get('transition'), 'power_pole_transition']], 'power_pole'),
        'icon-allow-overlap': true,
        'icon-size': 0.5,
        'text-field': step(zoom, '', [
          [15, concat(if_(has('name'), concat(get('name'), '\n'), ''), get('ref'))]
        ]),
        'text-font': font,
        'text-size': interpolate(zoom, [
          [13, 8],
          [21, 14]
        ]),
        'text-offset': interpolate(zoom, [
          [15, literal([0, 2.5])],
          [21, literal([0, 4])]
        ]),
        'text-max-angle': 10,
        'text-optional': true
      }
    },
    {
      zorder: 306,
      id: 'power_pole_point',
      type: 'circle',
      source: 'gespot',
      filter: all(utilityPower_p, ['==', ['get', 'type'], 'pole']),
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
      zorder: 561,
      id: 'power_line_label',
      type: 'symbol',
      filter: all(power_visible_p, not(match(get('line'), [[['busbar', 'bay'], true]], false))),
      source: 'gespot',
      'source-layer': 'power_line',
      minzoom: 10,
      paint: text_paint,
      layout: {
        'text-field': line_label,
        'text-font': font,
        'symbol-placement': 'line',
        'symbol-spacing': 400,
        'text-size': interpolate(
          zoom,
          [
            [10, 10],
            [20, 21]
          ],
          1.4
        ),
        'text-offset': case_(
          [
            [has('voltage_3'), literal([0, 1.5])],
            [has('voltage_2'), literal([0, 1.25])]
          ],
          literal([0, 1])
        ),
        'text-max-angle': 20
      }
    },
    {
      zorder: 570,
      id: 'power_line_label_low_zoom',
      type: 'symbol',
      filter: all(power_visible_p, any(['>', get('voltage'), 350], hvdc_p)),
      source: 'gespot',
      'source-layer': 'power_line',
      minzoom: 5,
      maxzoom: 10,
      paint: text_paint,
      layout: {
        'text-field': local_name,
        'text-font': font,
        'symbol-placement': 'line',
        'symbol-spacing': 400,
        'text-size': interpolate(zoom, [
          [5, 7],
          [10, 10]
        ]),
        'text-max-angle': 60,
        'text-padding': 15
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
        'text-font': font,
        'text-anchor': 'bottom',
        'text-offset': [0, -0.5],
        'text-size': interpolate(zoom, [
          [14, 9],
          [21, 14]
        ]),
        'text-max-width': 8
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
      minzoom: 9,
      layout: {
        'symbol-sort-key': ['-', 10000, voltage],
        'symbol-z-order': 'source',
        'text-field': substation_label,
        'text-font': font,
        'text-variable-anchor': ['top', 'bottom'],
        'text-radial-offset': 0.8,
        'text-size': interpolate(zoom, [
          [8, 10],
          [
            18,
            interpolate(voltage, [
              [0, 10],
              [400, 16]
            ])
          ]
        ]),
        'text-max-width': 8
      },
      paint: text_paint
    },
    {
      zorder: 562,
      id: 'power_substation_label_high_zoom',
      type: 'symbol',
      source: 'gespot',
      'source-layer': 'power_substation',
      minzoom: substation_label_switch_zoom,
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 600,
        'text-field': substation_label,
        'text-font': font,
        'text-size': 12,
        'text-offset': [0, -1]
      },
      paint: text_paint
    }
  ]
}
