import { IControl } from 'maplibre-gl'
import { t } from 'i18next'
import { el, mount, list, setStyle, RedomElement } from 'redom'
import { titleCase } from 'title-case'
import { materialColor_scale } from '../style/common.ts'
import { default as power_layers, voltage_scale, special_voltages } from '../style/style_gsp_power.ts'
import { mediumColor_scale as telecoMedium_scale } from '../style/style_gsp_telecoms.js'
import { default as natural_layers } from '../style/style_gsp_natural.js'

import { svgLine, svgCircle, svgLineFromLayer, svgRectFromLayer } from './svg.js'
import './key.css'
import { manifest } from 'virtual:render-svg'

const line_thickness = 6

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
      class: 'maplibregl-ctrl-icon oim-key-control',
      title: t('key.name'),
      ariaLabel: t('key.name')
    })

    this._container = el('div', { class: 'oim-key-panel' })

    this.populate()
    mount(document.body, this._container)

    this._control.onclick = () => {
      const button_position = this._control.getBoundingClientRect()
      this._container.style.top = button_position.top + 'px'
      this._container.style.right = document.documentElement.clientWidth - button_position.right + 'px'
      this._container.classList.add('visible')
    }

    return el('div', this._control, {
      class: 'maplibregl-ctrl maplibregl-ctrl-group'
    })
  }

  onRemove(): void {
    this._map = undefined
    this._container.remove()
    this._control.remove()
    this._pane = undefined
  }

  header() {
    const close_button = el('button.oim-key-close', '×')

    close_button.onclick = () => {
      this._container.classList.remove('visible')
    }
    return el('.oim-key-header', el('h2', t('key.name', 'Key')), close_button)
  }

  async populate() {
    mount(this._container, this.header())

    const pane = el('.oim-key-body')
    pane.appendChild(el('h3', t('key.infrastructure.label', 'Infrastructure')))
    mount(pane, await this.supportsTable())
    pane.appendChild(el('h3', t('key.power.label', 'Power')))
    mount(pane, await this.powerTable())
    mount(pane, await this.voltageTable())
    pane.appendChild(el('h3', t('key.telecoms.label', 'Telecoms')))
    mount(pane, await this.telecomTable())
    pane.appendChild(el('h3', t('key.natural.label', 'Environnement')))
    mount(pane, await this.naturalTable())
    this._pane = pane

    mount(this._container, pane)
  }

  async sprite(name: string, size = 25) {
    const spriteDiv = el('img.oim-key-symbol', {
      src: manifest['svg'][name],
      height: size
    })
    setStyle(spriteDiv, {
      'max-width': size + 'px'
    })
    return spriteDiv as unknown as SVGElement
  }

  // Infrastructure
  async supportsTable() {
    const rows = [
      [titleCase(t('names.tower', 'Tower/Pylon'), {sentenceCase: true}), await this.sprite('power_tower', 15)],
      [
        titleCase(t('names.power.tower-transition', 'Transition tower'), {sentenceCase: true}),
        await this.sprite('power_tower_transition', 15)
      ],
      [titleCase(t('names.pole'), {sentenceCase: true}), await this.sprite('pole', 15)],
      [titleCase(t('names.power.pole-transition', 'Transition pole'), {sentenceCase: true}), await this.sprite('power_pole_transition', 10)]
    ];
    
    for (const row of materialColor_scale) {
      let label = row[0]?.toString()
      if (!label) {
        label = t('undefined', 'Unknown')
      } else {
        label = titleCase(t('values.material.'+label, label), {sentenceCase: true})
      }

      rows.push([label, svgCircle(row[1], 'grey', 1, 8, 0)])
    }

    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  // Power
  async powerTable() {
    const rows = [
      [titleCase(t('names.power.pole', 'Power pole'), {sentenceCase: true}), await this.sprite('power_pole', 15)]
    ];

    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  async voltageTable() {
    let rows = []
    for (const row of voltage_scale) {
      let label = row[0]?.toString()
      if (!label) {
        label = t('units.below_10kv', '< 10 kV')
      } else {
        label = t('units.ge_kv', '≥ {{voltage}} kV', { voltage: label })
      }

      rows.push([label, row[1]])
    }

    rows.push([t('names.power.hvdc', 'HVDC'), special_voltages.hvdc])
    rows.push([t('key.traction', 'Traction (< 50 Hz)'), special_voltages.traction])

    rows = rows.map((row) => [row[0], svgLine(row[1], line_thickness)])

    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  // Telecoms
  async telecomTable() {
    const rows = [
      [titleCase(t('names.telecom.pole', 'Telecom pole'), {sentenceCase: true}), await this.sprite('telecom_pole', 15)],
      [titleCase(t('names.telecom.mast', 'Tower/mast'), {sentenceCase: true}), await this.sprite('comms_tower')]
    ];

    for (const row of telecoMedium_scale) {
      let label = row[0]?.toString()

      if (!label) {
        label = t('undefined', 'Indéfini')
      } else {
        label = titleCase(t('values.telecom-medium.'+label, label), {sentenceCase: true})
      }

      rows.push([label, svgLine(row[1], 2, '6 3')])
    }

    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  // Natural environement
  async naturalTable() {
    const rows = [
      [titleCase(t('names.natural.vegetation', 'Vegetation'), {sentenceCase: true}), svgRectFromLayer(natural_layers(), 'vegetation_forest')]
    ]
    
    const table = list('table', Tr)
    table.update(rows)
    return table
  }
}

export { KeyControl as default }
