import { svg, setStyle } from 'redom'

function getLayer(layers: { [key: string]: any }[], id: string) {
  for (const l of layers) {
    if (l['id'] == id) {
      return l
    }
  }
  return null
}

export function svgLine(colour: string, thickness: number, dash = '') {
  const height = 15
  const width = 30

  const line = svg('line', {
    x1: 0,
    y1: height / 2,
    x2: width,
    y2: height / 2
  })

  setStyle(line, {
    stroke: colour,
    'stroke-width': thickness,
    'stroke-dasharray': dash
  })

  return svg('svg', line, { height: height, width: width })
}

export function svgLineFromLayer(layers: { [key: string]: any }[], name: string, thickness = 2) {
  const layer = getLayer(layers, name)
  if (layer) {
    const dasharray = layer ? layer['paint']['line-dasharray'].join(' ') : ''
    return svgLine(layer['paint']['line-color'], thickness, dasharray)
  }
}

export function svgRect(colour: string, stroke = 'black', opacity = 1) {
  const height = 15
  const width = 30

  const rect = svg('rect', {
    width: width,
    height: height
  })

  setStyle(rect, {
    fill: colour,
    stroke: stroke,
    'stroke-width': 1,
    opacity: opacity
  })

  return svg('svg', rect, { height: height, width: width })
}

export function svgCircle(colour: string, stroke = 'black', opacity = 1, radius = 10, strokeWidth = 1) {
  let shape = svg('circle', {
    r: radius,
    cx : radius,
    cy : radius
  });

  setStyle(shape, {
    fill: colour,
    stroke: stroke,
    'stroke-width': strokeWidth,
    opacity: opacity,
  });

  return svg('svg', shape, {height: 2 * radius, width: 2 * radius});
}

export function svgRectFromLayer(layers: { [key: string]: any }[], name: string) {
  const layer = getLayer(layers, name)
  if (!layer) {
    return
  }
  let opacity = 1
  let outline_color = ''
  if (layer['paint']['fill-opacity']) {
    opacity = layer['paint']['fill-opacity']
  }
  if (layer['paint']['fill-outline-color']) {
    outline_color = layer['paint']['fill-outline-color']
  }
  return svgRect(layer['paint']['fill-color'], outline_color, opacity)
}

export function svgCircleFromLayer(layers: { [key: string]: any }[], name: string) {
  let layer = getLayer(layers, name);
  if (!layer) {
    return
  }
  let opacity = 1;
  let outline_color = '';
  if (layer['paint']['circle-opacity']) {
    opacity = layer['paint']['circle-opacity'];
  }
  if (layer['paint']['circle-stroke-color']) {
    outline_color = layer['paint']['circle-stroke-color'];
  }
  return svgCircle(layer['paint']['circle-color'], outline_color, opacity, 7);
}