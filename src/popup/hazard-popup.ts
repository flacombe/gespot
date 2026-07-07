import './hazard-popup.css'
import { OSMRemoteControl } from '../remote-control'
import i18next, { t } from 'i18next'
import { Marked } from '@ts-stack/markdown'
import { el, setChildren, text, mount } from 'redom'
import { titleCase } from 'title-case'
import maplibregl, { LngLat, MapGeoJSONFeature } from 'maplibre-gl'
import InfoPopup from './infopopup'
import { default as Gespot } from '../gespot.ts'

export class HazardPopup extends InfoPopup {
  app: Gespot

  constructor(app: Gespot, min_zoom: number) {
    super(['power_line_hazard'], min_zoom);

    this.app = app;
  }

  async popupHtml(feature: MapGeoJSONFeature) {
    const attrs_table = el('table', { class: 'item_info' })
    const renderedProperties = Object.keys(feature.properties)
      .sort()
      .map((key) => this.renderKey(key, feature.properties[key]))
      .filter((x) => x !== null) as HTMLTableRowElement[]
    setChildren(attrs_table, renderedProperties)

    const content = el('div.oim-popup-content')

    // Header
    const hazard_title = titleCase(t('hazard.electric.area', 'electric danger zone'), {sentenceCase: true})
    const header = el('div.oim-popup-header', el('h3', [el('img', { src: "img/iso_7010_w012.svg" }), hazard_title]));
    mount(content, header);

    // Content
    const mainrow = el('div')

    if (feature.properties['voltage'] || feature.properties['voltage_primary']) {
      mount(content, this.voltageField(feature))
    }

    let hazardZone_label = el('span.font-weight-bold.text-secondary', "distance inconnue");
    let hazardZone_message = el('p');
    switch (this.app.hazardElectric_status){
    case "DLI":
      hazardZone_label = el('span.font-weight-bold.text-info', "Distance Limite d'Investigation");
      hazardZone_message = el('p', "Elle est de 50 mètres autour d'un conducteur quelle que soit sa tension et vise à matérialiser la zone pour laquelle une étude des risques électriques est nécessaire.");
      break;
    case "DLVS":
      hazardZone_label = el('span.font-weight-bold.text-warning', "Distance Limite de Voisinage simple");
      hazardZone_message = el('p', "Elle s'étale de 5 à 3 mètres selon le niveau de tension. Une habilitation est nécessaire pour s'approcher au-delà.");
      break;
    case "DLVR":
      hazardZone_label = el('span.font-weight-bold.text-warning', "Distance Limite de Voisinage Renforcé");
      hazardZone_message = el('p', "Elle s'étale de 4 mètres à 30 centimètres. Des protections adaptées sont nécessaires pour s'approcher au-delà.");
      break;
    case "DMA":
      hazardZone_label = el('span.font-weight-bold.text-danger', "Distance minimale d'approche");
      hazardZone_message = el('p', "Elle s'étale de 2.5 mètres à 30 centimètres. Des méthodes de travail spécifiques sont nécessaires au-delà.");
      break;
    }

    let hazardMsg = el('div.d-inline-block.mr-2.align-text-top.hazardMessage');
    mount(hazardMsg, el('h6', ["Vous avez sélectionné une zone de risque électrique à l'intérieur de la ", hazardZone_label]));
    mount(hazardMsg, hazardZone_message);
    mount(hazardMsg, el('p', "L'affichage plan est donné à titre indicatif et extrapolé de la génératrice géométrique de l'ouvrage concerné sans garantie d'exactitude"));
    mount(mainrow, hazardMsg);

    const attrsContainer = el(`div.d-inline-block.align-text-top`)
    mount(attrsContainer, attrs_table);
    mount(mainrow, attrsContainer);
    mount(content, mainrow);

    // Footer
    const links_container = el('div.infobox-external-links')

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
    mount(footer, links_container)
    mount(
      footer,
      el('a.oim-button', 
        text(titleCase(t('hazard.electric.prevent', 'electric hazard prevention'), {sentenceCase: true})), 
        {"data-toggle":"modal", "data-target":"#electricityModal"}
      )
    )

    mount(content, footer)

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
      .addClassName('oim-popup-hazard')
  }
}

export { HazardPopup as default }