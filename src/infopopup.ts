import './infopopup.css'

import maplibregl, { MapGeoJSONFeature, MapMouseEvent, Popup } from 'maplibre-gl'
import { titleCase } from 'title-case'
// @ts-expect-error No types
import browserLanguage from 'in-browser-language'
import { local_name_tags } from './l10n.ts'
import friendlyNames from './friendlynames.ts'
import designIcons from './designicons.ts'
import { el, mount, setChildren, RedomElement } from 'redom'

const hidden_keys = [
  'osm_id',
  'name',
  'wikidata',
  'wikipedia',
  'construction',
  'tunnel',
  'is_node',
  'area',
  'gid',
  'ref_len',
  'frequency'
]

class InfoPopup {
  layers: string[]
  min_zoom: any
  popup_obj: Popup | null
  _map!: maplibregl.Map
  constructor(layers: string[], min_zoom: number) {
    this.layers = layers
    this.min_zoom = min_zoom
    this.popup_obj = null
  }

  add(map: maplibregl.Map) {
    this._map = map

    for (const layer of this.layers) {
      map.on('click', layer, (e) => {
        if (this._map.getZoom() > this.min_zoom) {
          this.popup(e)
        }
      })

      map.on('mouseenter', layer, () => {
        if (this._map.getZoom() > this.min_zoom) {
          map.getCanvas().style.cursor = 'pointer'
        }
      })
      map.on('mouseleave', layer, () => {
        if (this._map.getZoom() > this.min_zoom) {
          map.getCanvas().style.cursor = ''
        }
      })
    }
  }

  osmLink(id: number, is_node: boolean) {
    let url = ''
    let value = ''
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
    if (label in friendlyNames) {
      return friendlyNames[label]
    } else {
      return label
    }
  }

  designIcon(feature: string) {
    if (feature in designIcons) {
      return designIcons[feature]
    } else {
      return null
    }
  }

  renderKey(key: string, value: any) {
    if (hidden_keys.includes(key) || key.startsWith('name_') || key.startsWith('voltage') || !value) {
      return null
    }

    if (key.startsWith('voltage')) {
      value = `${Number(parseFloat(value).toFixed(2))} kV`
    }

    if (key == 'output') {
      const val = parseFloat(value)
      if (val < 1) {
        value = `${(val * 1000).toFixed(2)} kW`
      } else {
        value = `${val.toFixed(2)} MW`
      }
    }

    if (key == 'frequency' && value == '0') {
      value = 'DC'
    }

    if (key == 'url') {
      value = el('a', 'Website', {
        href: value,
        target: '_blank'
      })
      key = 'Website'
    } else {
      key = titleCase(this.friendlyRender(key))
    }

    return el('tr', el('th', key), el('td', value))
  }

  nameTags(feature: MapGeoJSONFeature) {
    let title_text = ''

    for (const tag of local_name_tags) {
      if (feature.properties[tag]) {
        title_text = feature.properties[tag]
        break
      }
    }

    if (!title_text) {
      title_text = this.friendlyRender(feature.layer['id'])
    }

    const container = el('h3', title_text)

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

    let text = [...voltages]
      .sort((a, b) => a - b)
      .reverse()
      .map((val) => val.toString())
      .join('/')
    text += ' kV'

    if (feature.properties['frequency']) {
      text += ` ${feature.properties['frequency'].replace(';', '/')} Hz`
    }

    return el('span.voltages', text)
  }

  popupHtml(feature: MapGeoJSONFeature) {
    const attrs_table = el('table', { class: 'item_info' })
    const renderedProperties = Object.keys(feature.properties)
      .sort()
      .map((key) => this.renderKey(key, feature.properties[key]))
      .filter((x) => x !== null) as HTMLTableRowElement[]
    setChildren(attrs_table, renderedProperties)

    const content = el('div.container.p-0')
    const mainrow = el('div.row', {style: "max-width:370px;"})
    mount(content, mainrow)

    // Design icon
    let featureRef = feature.layer['id'].replace('_point', '').replace('_symbol', '').replace('_label', '');
    let feature_iconpath;
    let maincontentwidth = "col-12";
    if (feature.properties['design_ref']){
      feature_iconpath = this.designIcon(featureRef+'_'+feature.properties['design_ref'])
    }else if (feature.properties['line_attachment'] && feature.properties['line_arrangement']){
      feature_iconpath = this.designIcon(featureRef+'_'+feature.properties['line_attachment']+'_'+feature.properties['line_arrangement'])
    }
    if (feature_iconpath != null) {
      mount(mainrow, el('div.col-6', el('img.designicon', { src: feature_iconpath })))
      maincontentwidth = "col-6";
    }else if(featureRef == "power_tower"){
      maincontentwidth = "col-5";
      let teaser = el('div.col-7');
      mount(teaser, el('h6', 'Le matériau ou la silhouette de ce support sont encore inconnus'))
      mount(teaser, el('span', 'Envie de contribuer ?'))
      mount(teaser, el('br'))
      mount(teaser, el('a', {target: "_blank", href:"https://www.openstreetmap.org/user/new", class:"font-weight-bold text-primary"}, 'Créez un compte'))
      mount(teaser, el('span', ' et '))
      mount(teaser, el('a', {target: "_blank", href:"https://wiki.openstreetmap.org/wiki/Power_networks/France/Aerien", class:"font-weight-bold text-primary"}, 'consultez la documentation'))
      mount(teaser, el('span', ' pour ajouter les informations manquantes directement sur OpenStreetMap !'))
      mount(mainrow, teaser);
    }

    const maincontent = el(`div.${maincontentwidth}`)
    mount(mainrow, maincontent);

    mount(maincontent, this.nameTags(feature));

    if (feature.properties['voltage']) {
      mount(maincontent, this.voltageField(feature))
    }

    const linksrow = el('div.row.no-gutters')
    mount(content, linksrow);
    const linkscontent = el('div.col-12.pt-3')
    mount(linksrow, linkscontent)

    const wikidata_div = el('div')
    if (feature.properties['wikidata']) {
      this.fetch_wikidata(feature.properties['wikidata'], wikidata_div, linkscontent)
    } else {
      const wp_link = this.wp_link(feature.properties['wikipedia'])
      if (wp_link) {
        mount(linkscontent, wp_link)
      }
    }

    mount(maincontent, wikidata_div)
    mount(maincontent, attrs_table)

    if (feature.properties['osm_id']) {
      mount(
        linkscontent,
        el('a', el('div.ext_link.osm_link'), {
          href: this.osmLink(feature.properties['osm_id'], feature.properties['is_node']),
          target: '_blank',
          title: 'OpenStreetMap'
        })
      )
    }

    return content
  }

  popup(e: MapMouseEvent & { features?: MapGeoJSONFeature[] | undefined }) {
    if (this.popup_obj && this.popup_obj.isOpen()) {
      this.popup_obj.remove()
    }

    if (e.features === undefined || e.features.length == 0) {
      return
    }

    this.popup_obj = new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setDOMContent(this.popupHtml(e.features[0]))
      .setMaxWidth('350px')
      .addTo(this._map)
    this.popup_obj.addClassName('oim-info')
  }

  fetch_wikidata(id: string, container: RedomElement, links_container: RedomElement) {
    fetch(`https://openinframap.org/wikidata/${id}`)
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        if (data['thumbnail']) {
          mount(
            container,
            el(
              'a',
              el('img.wikidata_image', {
                src: data['thumbnail']
              }),
              {
                href: `https://commons.wikimedia.org/wiki/File:${data['image']}`,
                target: '_blank'
              }
            )
          )
        }

        const languages = browserLanguage.list()
        languages.push('en')
        for (const lang of languages) {
          if (data['sitelinks'][`${lang}wiki`]) {
            mount(
              links_container,
              el('a', el('div.ext_link.wikipedia_link'), {
                href: data['sitelinks'][`${lang}wiki`]['url'],
                target: '_blank',
                title: 'Wikipedia'
              })
            )
            break
          }
        }

        if (data['sitelinks']['commonswiki']) {
          mount(
            links_container,
            el('a', el('div.ext_link.commons_link'), {
              href: data['sitelinks']['commonswiki']['url'],
              target: '_blank',
              title: 'Wikimedia Commons'
            })
          )
        }

        mount(
          links_container,
          el('a', el('div.ext_link.wikidata_link'), {
            href: `https://wikidata.org/wiki/${id}`,
            target: '_blank',
            title: 'Wikidata'
          })
        )
      })
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
        title: 'Wikipedia'
      })
    }
  }
}

export { InfoPopup as default }