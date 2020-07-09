import {el, text} from 'redom';
import invert from 'lodash.invert';
import isEqual from 'lodash.isequal';
import './layerswitcher.css';
import 'bootstrap4-toggle';
import 'bootstrap4-toggle/css/bootstrap4-toggle.min.css';

class LayerSwitcher {
  constructor(layers, default_visible = []) {
    this._layers = layers;
    this._identifiers = this._initLayerIdentifiers();
    this._default_visible = default_visible;
    this._container = el('div.d-inline.text-nowrap');
    this._visible = [...default_visible];
  }

  _initLayerIdentifiers() {
    let identifiers = {};
    Object.keys(this._layers)
      .sort()
      .forEach(layer_name => {
        let size = 1;
        let ident = null;
        do {
          ident = layer_name.slice(0, size);
          size++;
        } while (ident in identifiers);
        identifiers[ident] = layer_name;
      });
    return identifiers;
  }

  _getLayerIdentifiers() {
    let identifiers = [];
    let id_map = invert(this._identifiers);
    this._visible.sort().forEach(layer_name => {
      identifiers.push(id_map[layer_name]);
    });
    return identifiers;
  }

  _updateVisibility() {
    var layers = this._map.getStyle().layers;
    for (let layer of layers) {
      let name = layer['id'];
      for (let layer_name in this._layers) {
        let pref = this._layers[layer_name];
        if (name.startsWith(pref)) {
          if (this._visible.includes(layer_name)) {
            this._map.setLayoutProperty(name, 'visibility', 'visible');
          } else {
            this._map.setLayoutProperty(name, 'visibility', 'none');
          }
        }
      }
    }
    if (this.urlhash) {
      this.urlhash._updateHash();
    }
  }

  setInitialVisibility(style) {
    /**
     * Modify a map style before adding to the map to set initial visibility states.
     * This prevents flash-of-invisible-layers.
     */
    for (let layer of style['layers']) {
      for (let layer_name in this._layers) {
        let pref = this._layers[layer_name];
        if (
          layer['id'].startsWith(pref) &&
          !this._visible.includes(layer['id'])
        ) {
          if (!('layout' in layer)) {
            layer['layout'] = {};
          }
          layer['layout']['visibility'] = 'none';
        }
      }
    }
  }

  getURLString() {
    if (!isEqual(this._visible.sort(), this._default_visible.sort())) {
      return this._getLayerIdentifiers().join(',');
    }
    return null;
  }

  setURLString(string) {
    if (string) {
      const ids = string.split(',');
      if (ids.length == 0) {
        this._visible = [...this._default_visible];
      } else {
        this._visible = ids.map(id => this._identifiers[id]).filter(id => id);
      }
    } else {
      this._visible = [...this._default_visible];
    }
    if (this._map) {
      this._updateVisibility();
    } 
  }

  onAdd(map) {
    this._map = map;
    if (map.isStyleLoaded()) {
      this._updateVisibility();
    } else {
      map.on('load', () => {
        this._updateVisibility();
      });
    }
    this._createList();

    return this._container;
  }

  _createList() {
    var i = 0;
    for (let name in this._layers) {
      let checkbox = el('input', {
        type: 'checkbox',
        id: 'layer' + i,
        checked: this._visible.includes(name),
        "data-size":"xs",
        "data-toggle":"toggle",
        "data-onstyle":"dark"
      });
      let label = el('label', name, {for: 'layer' + i, "class":"pr-2"});

      checkbox.onchange = e => {
        if (e.target.checked) {
          this._visible.push(name);
        } else {
          this._visible = this._visible.filter(item => item !== name);
        }
        this._updateVisibility();
      };

      this._container.appendChild(el('div', {"class":"mx-2 d-inline"}, [label, checkbox]));
      i++;
    }
  }
}

export {LayerSwitcher as default};
