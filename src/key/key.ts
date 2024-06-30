import { IControl } from 'maplibre-gl'
import {el, mount, list, setStyle, RedomElement} from 'redom';
import {materialColor_scale} from '../style/common.js';
import {powerColor} from '../style/style_gsp_power.js';
import {telecomColor, mediumColor_scale} from '../style/style_gsp_telecoms.js';
import {svgLine, svgCircle} from './svg.js';
import './key.css';
// @ts-expect-error Vite virtual module
import { manifest } from 'virtual:render-svg'

class Td {
  el: HTMLTableCellElement
  constructor() {
    this.el = el('td')
  }
  update(data: string | RedomElement) {
    if (typeof data == 'string') {
      this.el.innerHTML = data
    } else if (!data) {
      return
    } else {
      mount(this.el, data)
    }
  }
}

const Tr = list.extend('tr', Td)

class KeyControl implements IControl {
  _map: maplibregl.Map | undefined
  _control!: HTMLButtonElement
  _container!: HTMLDivElement
  _pane: RedomElement | undefined
  onAdd(map: maplibregl.Map) {
    this._map = map

    this._control = el('button', {
      class: 'maplibregl-ctrl-icon oim-key-control'
    })

    this._container = el('div', { class: 'maplibregl-ctrl oim-key-panel' })

    this.populate()

    this._control.onclick = () => {
      this._container.style.display = 'block'
      this._control.style.display = 'none'
    }

    setTimeout(() => this.resize(), 100)
    this._map.on('resize', () => this.resize())
    return el('div', this._control, this._container, {
      class: 'maplibregl-ctrl maplibregl-ctrl-group'
    })
  }

  onRemove(): void {
    this._map = undefined
    this._container.remove()
    this._control.remove()
    this._pane = undefined
  }

  resize() {
    if (!this._pane) {
      return
    }
    // Set max-height of key depending on window style
    const map_style = window.getComputedStyle(this._map!.getContainer())
    let cont_style
    if (this._control.style.display != 'none') {
      cont_style = this._control.getBoundingClientRect()
    } else {
      cont_style = this._container.getBoundingClientRect()
    }
    const height = parseInt(map_style.height) - cont_style.top - 100 + 'px'
    setStyle(this._pane, { 'max-height': height })
  }

  header() {
    const close_button = el('.oim-key-close', '×')

    close_button.onclick = () => {
      this._container.style.display = 'none'
      this._control.style.display = 'block'
    }
    return el('.oim-key-header', el('h2', 'Légende'), close_button)
  }

  async populate() {
    mount(this._container, this.header());

    let pane = el('.oim-key-pane');
    pane.appendChild(el('h4', 'Supports'));
    mount(pane, await this.supportsTable());
    pane.appendChild(el('h4', 'Energie'));
    mount(pane, this.powerTable());
    pane.appendChild(el('h4', 'Télécoms'));
    mount(pane, await this.telecomTable());
    this._pane = pane;

    mount(this._container, pane);
  }

  async supportsTable() {
    let rows = [];
    for (let row of materialColor_scale) {
      let label = row[0];
      if (row[1] == null){
        continue;
      }
      if (label === null) {
        label = 'Commun';
      } else {
        label = `${label}`;
      }

      rows.push([label, row[1]]);
    }

    rows = rows.map(row => [row[0], svgCircle(row[1], 'grey', 1, 8, 0)]);
    rows.push(['Pylône', await this.sprite('power_tower')]);
    rows.push(['Transition aéro-sout', await this.sprite('power_pole_transition')]);

    let table = list('table', Tr);
    table.update(rows);
    return table;
  }

  async sprite(name: string, size = 25) {
    const spriteDiv = el('img.oim-plant-sprite', {
      src: manifest['svg'][name],
      height: size
    })
    setStyle(spriteDiv, {
      'max-width': size + 'px'
    })
    return spriteDiv as unknown as SVGElement
  }

  powerTable() {
    let rows = [
      ['Appui élec', svgCircle("#dedede", powerColor, 1, 8, 3)],
    ];
    
    let table = list('table', Tr);
    table.update(rows);
    return table;
  }

  async telecomTable() {
    let rows = [];
    for (let row of mediumColor_scale) {
      let label = row[0];
      if (row[1] == null){
        continue;
      }
      if (label === null) {
        label = 'Artère inconnue';
      } else {
        label = `Artère ${label}`;
      }

      rows.push([label, row[1]]);
    }

    rows = rows.map(row => [row[0], svgLine(row[1], 2, '6 3')]);
    rows.push(['Appui télécom', svgCircle("#dedede", telecomColor, 1, 8, 3)]);
    rows.push(['Pylône radio', await this.sprite('comms_tower')]);

    let table = list('table', Tr);
    table.update(rows);
    return table;
  }
}

export {KeyControl as default};
