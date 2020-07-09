import {svg, setStyle} from 'redom';

function getLayer(layers, id) {
  for (let l of layers) {
    if (l['id'] == id) {
      return l;
    }
  }
  return null;
}

export function svgLine(colour, thickness, dash = '') {
  const height = 15;
  const width = 30;

  let line = svg('line', {
    x1: 0,
    y1: height / 2,
    x2: width,
    y2: height / 2,
  });

  setStyle(line, {
    stroke: colour,
    'stroke-width': thickness,
    'stroke-dasharray': dash,
  });

  return svg('svg', line, {height: height, width: width});
}

export function svgLineFromLayer(layers, name, thickness = 2) {
  let layer = getLayer(layers, name);
  let dasharray = '';
  if (layer['paint']['line-dasharray']) {
    dasharray = layer['paint']['line-dasharray'].join(' ');
  }
  return svgLine(layer['paint']['line-color'], thickness, dasharray);
}

export function svgRect(colour, stroke = 'black', opacity = 1) {
  const height = 15;
  const width = 30;

  let rect = svg('rect', {
    width: width,
    height: height,
  });

  setStyle(rect, {
    fill: colour,
    stroke: stroke,
    'stroke-width': 1,
    opacity: opacity,
  });

  return svg('svg', rect, {height: height, width: width});
}

export function svgCircle(colour, radius = 10, stroke = 'black', strokeWidth = 1) {
  let circle = svg('circle', {
    r: radius,
    cx: radius+2,
    cy: radius+2
  });

  setStyle(circle, {
    fill: colour,
    stroke: stroke,
    'stroke-width': strokeWidth,
    opacity: 1,
  });

  return svg('svg', circle, {
    width: radius*2 + 5,
    height: radius*2 + 5
  });
}

export function svgRectFromLayer(layers, name) {
  let layer = getLayer(layers, name);
  let dasharray = '';
  let opacity = 1;
  let outline_color = '';
  if (layer['paint']['fill-opacity']) {
    opacity = layer['paint']['fill-opacity'];
  }
  if (layer['paint']['fill-outline-color']) {
    outline_color = layer['paint']['fill-outline-color'];
  }
  return svgRect(layer['paint']['fill-color'], outline_color, opacity);
}
