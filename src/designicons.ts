// @ts-expect-error Vite virtual module
import { manifest } from 'virtual:render-svg'

// Map layers icons to show in the infobox
const designIcons: { [key: string]: string } = {
  power_tower_A1: manifest['svg']['power_tower_A1'],
  power_tower_A2: manifest['svg']['power_tower_A2'],
  power_tower_B1: manifest['svg']['power_tower_B1'],
  power_tower_B1B3: manifest['svg']['power_tower_B1B3'],
  power_tower_B1C3: manifest['svg']['power_tower_B1C3'],
  power_tower_C4: manifest['svg']['power_tower_C4'],
  power_tower_F44: manifest['svg']['power_tower_F44'],
  power_tower_F5: manifest['svg']['power_tower_F5'],
  power_tower_G1: manifest['svg']['power_tower_G1'],
  power_tower_G4D4: manifest['svg']['power_tower_G4D4'],
  power_tower_G4B3: manifest['svg']['power_tower_G4B3'],
  power_tower_J41B: manifest['svg']['power_tower_J41B'],
  power_tower_J41D3: manifest['svg']['power_tower_J41D3'],
  power_tower_L1: manifest['svg']['power_tower_L1'],
  power_tower_L1M3: manifest['svg']['power_tower_L1M3'],
  power_tower_M1: manifest['svg']['power_tower_M1'],
  power_tower_S13: manifest['svg']['power_tower_S13'],
  power_tower_T5: manifest['svg']['power_tower_T5'],
  power_pole_pin_delta: manifest['svg']['power_pole_vr'],
  power_pole_suspension_semi_horizontal: manifest['svg']['power_pole_nv']
}

export default designIcons