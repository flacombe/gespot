import {el, text, mount, list, setStyle} from 'redom';
import {scale_color, text_paint, operator_text, construction_p, underground_p, poleRadius_p, materialColor_scale, lineOpacity_p} from '../style/style_gsp_common.js';
import {powerLayers, voltage_scale, special_voltages, warningAreas_filters, powerColor} from '../style/style_gsp_power.js';
import {telecomLayers, telecomColor, mediumColor_scale} from '../style/style_gsp_telecoms.js';
import {svgLine, svgCircle, svgLineFromLayer, svgRectFromLayer} from './svg.js';
import './key.css';

class Td {
  constructor() {
    this.el = el('td');
  }
  update(data) {
    if (typeof data != 'object') {
      this.el.textContent = data;
    } else if (data === null) {
      return;
    } else {
      mount(this.el, data);
    }
  }
}

const Tr = list.extend('tr', Td);

class KeyControl {
  onAdd(map) {
    this._map = map;

    this._control = el('button', {
      class: 'mapboxgl-ctrl-icon oim-key-control',
    });

    this._container = el('div', {class: 'mapboxgl-ctrl oim-key-panel'});

    this.populate();

    this._control.onclick = e => {
      this._container.style.display = 'block';
      this._control.style.display = 'none';
    };

    setTimeout(e => this.resize(), 100);
    this._map.on('resize', e => this.resize());
    return el('div', this._control, this._container, {
      class: 'mapboxgl-ctrl mapboxgl-ctrl-group',
    });
  }

  resize() {
    // Set max-height of key depending on window style
    let map_style = window.getComputedStyle(this._map.getContainer());
    let cont_style;
    if (this._control.style.display != 'none') {
      cont_style = this._control.getBoundingClientRect();
    } else {
      cont_style = this._container.getBoundingClientRect();
    }
    let height = parseInt(map_style.height) - cont_style.top - 80 + 'px';
    setStyle(this._pane, {'max-height': height});
  }

  header() {
    const close_button = el('.oim-key-close', '×');

    close_button.onclick = e => {
      this._container.style.display = 'none';
      this._control.style.display = 'block';
    };
    return el('.oim-key-header', el('h2', 'Légende'), close_button);
  }

  populate() {
    mount(this._container, this.header());

    let pane = el('.oim-key-pane');
    pane.appendChild(el('h4', 'Supports'));
    mount(pane, this.supportsTable());
    pane.appendChild(el('h4', 'Energie'));
    mount(pane, this.powerTable());
    pane.appendChild(el('h4', 'Télécoms'));
    mount(pane, this.telecomTable());
    this._pane = pane;

    mount(this._container, pane);
  }

  supportsTable() {
    let rows = [];
    for (let row of materialColor_scale) {
      let label = row[0];
      if (label === null) {
        label = 'Commun';
      } else {
        label = `${label}`;
      }

      rows.push([label, row[1]]);
    }

    rows = rows.map(row => [row[0], svgCircle(row[1], 8, 'grey', 0)]);
    rows.push(['Pylône', this.sprite('power_tower')]);
    rows.push(['Transition aéro-sout', this.sprite('power_pole_transition')]);

    let table = list('table', Tr);
    table.update(rows);
    return table;
  }

  sprite(name, size = 25) {
    let spriteDiv = el('img.oim-key-sprite', {
      src: `/style/sprites/${name}.svg`,
      height: size,
    });
    setStyle(spriteDiv, {
      'max-width': size + 'px',
    });
    return spriteDiv;
  }

  powerTable() {
    let rows = [
      ['Appui élec', svgCircle("#dedede", 8, powerColor, 3)],
    ];
    
    let table = list('table', Tr);
    table.update(rows);
    return table;
  }

  telecomTable() {
    let rows = [];
    for (let row of mediumColor_scale) {
      let label = row[0];
      if (label === null) {
        label = 'Artère inconnue';
      } else {
        label = `Artère ${label}`;
      }

      rows.push([label, row[1]]);
    }

    rows = rows.map(row => [row[0], svgLine(row[1], 2, '6 3')]);
    rows.push(['Appui télécom', svgCircle("#dedede", 8, telecomColor, 3)]);
    rows.push(['Pylône radio', this.sprite('comms_tower')]);

    let table = list('table', Tr);
    table.update(rows);
    return table;
  }
}

export {KeyControl as default};
