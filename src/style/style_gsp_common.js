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
function scale_color(tag, scale) {
  let result = ['match', ["get", tag]];
  
  for (let row of scale) {
    if (row[0] == null){
      result.push(row[1]);
      continue;
    }
    result.push(row[0]);
    result.push(row[1]);
  }

  return result;
}

const materialColor_scale = [
  ['wood', '#7d5121'],
  ['metal', '#808080'],
  ['concrete', '#333333'],
  ['composite', '#77b3fe'],
  [null,'#020202']
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
const lineOpacity_p = ['interpolate', ['linear'], ['zoom'], 9, 1, 10, 0.6, 14, 0.35]

export {scale_color, text_paint, operator_text, construction_p, underground_p, poleRadius_p, materialColor_scale, lineOpacity_p};
