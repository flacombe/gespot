import { StyleSpecification } from 'maplibre-gl'

const style: StyleSpecification = {
  version: 8,
  name: "Gespot",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://api.maptiler.com/tiles/v3/tiles.json?key=2raHq2ahXwNHsKorHH5t"
    },
    gespot: {
      type: "vector",
      url: "https://gespot.fr/map.json"
    },
    natural: {
      type: "vector",
      url: "https://gespot.fr/natural.json"
    }
  },
  glyphs: '/fonts/{fontstack}/{range}.pbf',
  layers: []
}

export default style