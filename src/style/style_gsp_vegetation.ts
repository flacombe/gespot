
import { LayerSpecificationWithZIndex } from './types.js'

const layers: LayerSpecificationWithZIndex[] = [
  {
    zorder: 40,
    id: 'vegetation_forest',
    type: 'fill',
    source: 'natural',
    minzoom: 11,
    'source-layer': 'forest',
    paint: {
      'fill-opacity': 0.65,
      'fill-color': "#3e6651",
      'fill-outline-color': "#003519"
    },
  }

];

export {layers as vegetationLayers};
