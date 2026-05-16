import './infopopup.css'

import { t } from 'i18next'
import maplibregl, { LngLat, MapGeoJSONFeature, Popup } from 'maplibre-gl'
import { titleCase } from 'title-case'
import { local_name_tags, formatVoltage, formatFrequency, formatPower } from '../l10n.ts'
import friendlyNames from '../friendlynames.ts'
import friendlyIcons from '../friendlyicons.ts'
import designIcons from '../designicons.ts'
import { el, mount, setChildren, RedomElement } from 'redom'
import { ClickRouter } from '../click-router.ts'

const hidden_keys = [
  'osm_id',
  'name',
  'wikidata',
  'operator_wikidata',
  'wikipedia',
  'construction',
  'tunnel',
  'is_node',
  'area',
  'gid',
  'ref_len',
  'frequency',
  'transition',
  'angle'
]

function fieldName(key: string) {
  key = key.replace('_', '-').replace(':', '-');

  return titleCase(t(`info.${key}`, key));
}

function fieldValue(key: string, value: any): any {
  if (typeof value !== 'string') {
    return value
  }

  key = key.replace('_', '-').replace(':', '-');
  return t(`values.${key}.${value}`, value);
}

function truncateUrl(urlString: string, length: number): string {
  // Trim trailing slash
  urlString = urlString.replace(/\/$/, '')

  if (urlString.length <= length) {
    return urlString
  }

  const parsed = new URL(urlString)
  // Remove www from host
  parsed.host = parsed.host.replace(/^www\./, '')
  if (parsed.toString().length <= length) {
    return parsed.toString()
  }

  const TRUNCATE_SYMBOL_LENGTH = 2
  const pathParts = parsed.pathname.split('/')

  let remainingLength = length - parsed.host.length - TRUNCATE_SYMBOL_LENGTH
  const pathPartsReturnValue = []
  let index = pathParts.length

  while (index--) {
    const x = pathParts[index]

    if (x.length === 0) {
      continue
    }

    if (remainingLength < x.length + 1) {
      pathPartsReturnValue.push('…')
      break
    }

    pathPartsReturnValue.push(x)
    remainingLength -= x.length + 1
  }

  return [parsed.host, ...pathPartsReturnValue.reverse()].join('/')
}

class InfoPopup {
  layers: string[]
  min_zoom: any
  popup_obj: Popup | null
  _map!: maplibregl.Map
  friendlyNames: { [key: string]: string }

  constructor(layers: string[], min_zoom: number) {
    this.layers = layers
    this.min_zoom = min_zoom
    this.popup_obj = null
    this.friendlyNames = friendlyNames()
  }

  add(map: maplibregl.Map, clickRouter: ClickRouter) {
    this._map = map

    clickRouter.registerHandler(this.layers, (f, l) => this.popup(f, l))

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.popup_obj) {
        this.popup_obj.remove()
      }
    })
  }

  osmLink(id: number, is_node: boolean) {
    let url
    let value
    if (id > 0) {
      if (is_node) {
        url = `https://openstreetmap.org/node/${id}`
        value = `Node ${id}`
      } else {
        url = `https://openstreetmap.org/way/${id}`
        value = `Way ${id}`
      }
    } else {
      url = `https://openstreetmap.org/relation/${-id}`
      value = `Relation ${-id}`
    }
    return el('a', value, {
      href: url,
      target: '_blank'
    })
  }

  friendlyRender(label: string) {
    let friendlyName = label
    let prefixLen = 0
    for (const name in this.friendlyNames) {
      if (label.startsWith(name) && name.length > prefixLen) {
        friendlyName = this.friendlyNames[name]
        prefixLen = name.length
      }
    }
    return friendlyName
  }

  friendlyIcon(feature: string) {
    if (feature in friendlyIcons) {
      return friendlyIcons[feature]
    } else {
      return null
    }
  }

  designIcon(feature: string) {
    if (feature in designIcons) {
      return designIcons[feature]
    } else {
      return null
    }
  }

  renderKey(key: string, value: any): HTMLTableRowElement | null {
    if (hidden_keys.includes(key) || key.startsWith('name_') || key.startsWith('voltage') || !value) {
      return null
    }

    let prettyValue = value

    if (key.startsWith('voltage')) {
      prettyValue = formatVoltage(value)
    }

    if (key == 'output') {
      prettyValue = formatPower(parseFloat(value))
    }

    if (key == 'frequency' && value == '0') {
      prettyValue = t('units.DC')
    }

    let prettyKey
    if (key == 'url') {
      prettyKey = t('info.website')
      prettyValue = el('a', truncateUrl(value, 30), {
        href: value,
        target: '_blank'
      })
    } else {
      prettyKey = fieldName(key)
    }

    return el('tr', el('th', prettyKey), el('td', fieldValue(key, prettyValue)))
  }

  nameTags(feature: MapGeoJSONFeature) {
    let title_text = ''

    for (const tag of local_name_tags()) {
      if (feature.properties[tag]) {
        title_text = feature.properties[tag]
        break
      }
    }

    if (!title_text) {
      title_text = this.friendlyRender(feature.layer['id'])
    }

    let feature_title = el('h3', titleCase(title_text, {sentenceCase: true}))
    const feature_iconpath = this.friendlyIcon(feature.layer['id'])
    if (feature_iconpath != null) {
      feature_title = el('h3', el('img', { src: feature_iconpath, height: 35 }), titleCase(title_text, {sentenceCase: true}))
    }

    const container = el('div.oim-popup-header', feature_title)

    // If we're showing a translated name, also show the name tag
    if (feature.properties.name && title_text != feature.properties.name) {
      mount(container, el('h4', feature.properties.name))
    }

    return container
  }

  voltageField(feature: MapGeoJSONFeature): RedomElement {
    const voltages = new Set(
      Object.keys(feature.properties)
        .filter((key) => key.startsWith('voltage'))
        .map((key) => parseFloat(feature.properties[key]))
    )

    let text = formatVoltage(Array.from(voltages))

    if (feature.properties['frequency']) {
      const frequencies = feature.properties.frequency.split(';').map((x: string) => parseFloat(x))
      text += ` ${formatFrequency(frequencies)}`
    }

    return el('span.voltages', text)
  }

  async popupHtml(feature: MapGeoJSONFeature) {
    const attrs_table = el('table', { class: 'item_info' })
    const renderedProperties = Object.keys(feature.properties)
      .sort()
      .map((key) => this.renderKey(key, feature.properties[key]))
      .filter((x) => x !== null) as HTMLTableRowElement[]
    setChildren(attrs_table, renderedProperties)

    const content = el('div.oim-popup-content', this.nameTags(feature))
    const mainrow = el('div')

    if (feature.properties['voltage'] || feature.properties['voltage_primary']) {
      mount(content, this.voltageField(feature))
    }

    // Design icon
    let featureRef = feature.layer['id'].replace('_point', '').replace('_symbol', '').replace('_label', '');
    let feature_iconpath;
    if (feature.properties['design_ref']){
      feature_iconpath = this.designIcon(featureRef+'_'+feature.properties['design_ref'])
    }else if (feature.properties['line_attachment'] && feature.properties['line_arrangement']){
      feature_iconpath = this.designIcon(featureRef+'_'+feature.properties['line_attachment']+'_'+feature.properties['line_arrangement'])
    }
    if (feature_iconpath != null) {
      mount(mainrow, el('div.d-inline-block.mr-2.align-text-top.designicon', el('img', { src: feature_iconpath })))
    }else if(featureRef == "power_tower"){
      let teaser = el('div.d-inline-block.mr-2.align-text-top.designteaser');
      mount(teaser, el('h6', 'Le matériau ou la silhouette de ce support sont encore inconnus'))
      mount(teaser, el('span', 'Envie de contribuer ?'))
      mount(teaser, el('br'))
      mount(teaser, el('a', {target: "_blank", href:"https://www.openstreetmap.org/user/new", class:"font-weight-bold text-primary"}, 'Créez un compte'))
      mount(teaser, el('span', ' et '))
      mount(teaser, el('a', {target: "_blank", href:"https://wiki.openstreetmap.org/wiki/Power_networks/France/Aerien", class:"font-weight-bold text-primary"}, 'consultez la documentation'))
      mount(teaser, el('span', ' pour ajouter les informations manquantes directement sur OpenStreetMap !'))
      mount(mainrow, teaser);
    }

    const maincontent = el(`div.d-inline-block.align-text-top`)
    mount(maincontent, attrs_table);
    mount(mainrow, maincontent);

    const links_container = el('div.infobox-external-links')
    const image_container = el('div.infobox-image')
    const wp_link = this.wp_link(feature.properties['wikipedia'])
    if (wp_link) {
      mount(links_container, wp_link)
    }

    mount(content, image_container)
    mount(content, mainrow)

    if (feature.properties['osm_id']) {
      mount(
        links_container,
        el('a', el('div.ext_link.osm_link'), {
          href: this.osmLink(feature.properties['osm_id'], feature.properties['is_node']),
          target: '_blank',
          title: t('info.view-openstreetmap', 'View on OpenStreetMap')
        })
      )
    }

    const footer = el('div.oim-info-footer')
    mount(content, footer)
    mount(footer, links_container)

    return content
  }

  async popup(feature: MapGeoJSONFeature, location: LngLat) {
    if (this.popup_obj && this.popup_obj.isOpen()) {
      this.popup_obj.remove()
    }

    if (import.meta.env.DEV) {
      console.info('Clicked feature on layer', feature.layer.id, 'at', location, '\n', feature.properties)
    }

    this.popup_obj = new maplibregl.Popup()
      .setLngLat(location)
      .setDOMContent(await this.popupHtml(feature))
      .addTo(this._map)
      .addClassName('oim-popup')
      .addClassName('oim-popup-info')
  }

  wp_link(value: string) {
    if (!value) {
      return null
    }
    const parts = value.split(':', 2)
    if (parts.length > 1) {
      const url = `https://${parts[0]}.wikipedia.org/wiki/${parts[1]}`
      return el('a', el('div.ext_link.wikipedia_link'), {
        href: url,
        target: '_blank',
        title: t('wikipedia', 'Wikipedia')
      })
    }
  }
}

export { InfoPopup as default }
