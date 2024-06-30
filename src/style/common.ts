import { DataDrivenPropertyValueSpecification, ExpressionSpecification } from 'maplibre-gl'
import { local_name_tags } from '../l10n.ts'

export const local_name: ExpressionSpecification = (['coalesce'] as any).concat(
  local_name_tags.map((tag) => ['get', tag])
) as ExpressionSpecification

const text_paint = {
  'text-halo-width': 4,
  'text-halo-blur': 2,
  'text-halo-color': 'rgba(230, 230, 230, 1)'
}

const operator_text: ExpressionSpecification = [
  'step',
  ['zoom'],
  ['get', 'name'],
  14,
  ['case', ['has', 'operator'], ['concat', ['get', 'name'], ' (', ['get', 'operator'], ')'], ['get', 'name']]
]

const construction_p: ExpressionSpecification = ['get', 'construction'];

// Colors
function scale_color(tag: string, scale: { [key: string]: any }[]): DataDrivenPropertyValueSpecification<string> {
  let result: any = ['match', ["get", tag]];
  
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
  ['wood', '#815727'],
  ['metal', '#99a89e'], // deprecated
  ['steel', '#99a89e'],
  ['concrete', '#4d4d4d'],
  ['composite', '#6087b8'], // deprecated
  ['epoxy', '#6087b8'],
  [null,'#dedede']
];

const poleRadius_p: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'],
  5, 0,
  14, 2,
  17, 5.5
];

const underground_p: ExpressionSpecification = [
  'any',
  ['==', ['get', 'location'], 'underground'],
  ['==', ['get', 'location'], 'underwater'],
  ['==', ['get', 'tunnel'], true],
  [
    'all', // Power cables are underground by default
    ['==', ['get', 'type'], 'cable'],
    ['==', ['get', 'location'], '']
  ]
]

// Function to assign opacity to lines according to zoom
const lineOpacity_p: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 9, 1, 10, 0.6, 14, 0.3]

const font = ['Noto Sans Regular']

export {scale_color, text_paint, operator_text, construction_p, underground_p, poleRadius_p, materialColor_scale, lineOpacity_p, font }