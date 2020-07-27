const text_paint = {
  'text-halo-width': 4,
  'text-halo-blur': 2,
  'text-halo-color': "rgba(230, 230, 230, 1)",
}

const operator_text = ["step", ["zoom"],
        ['get', 'name'],
        14, ["case", ['has', 'operator'],
              ["concat", ['get', 'name'], ' (', ['get', 'operator'], ')'],
              ['get', 'name']
        ]
      ];

const construction_p = ['get', 'construction'];

// Colors
const materialColor_scale = [
  ['wood', '#61637A'],
  ['metal', '#ff8900'],
  ['concrete', '#136fff'],
  ['composite', '#136fff'],
  [null,'#7A7A85']
];

const poleRadius_p = ["step", ["zoom"],
  2,
  16,
  5
];

const underground_p = ["any",
  ['==', ['get', 'location'], 'underground'],
  ['==', ['get', 'location'], 'underwater'],
  ['==', ['get', 'tunnel'], true],
  ['all', // Power cables are underground by default
    ['==', ['get', 'type'], 'cable'],
    ['==', ['get', 'location'], '']
  ]
];

// Function to assign opacity to lines according to zoom
const lineOpacity_p = ['interpolate', ['linear'], ['zoom'], 9, 1, 10, 0.6, 14, 0.2]

export {text_paint, operator_text, construction_p, underground_p, poleRadius_p, materialColor_scale, lineOpacity_p};
