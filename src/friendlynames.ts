import { t } from 'i18next'

// Map layer names to a descriptive string to show in the infobox
export default function friendlyNames(): { [key: string]: string } {
  return {
    power_tower: t('names.power.tower','power tower'),
    power_pole_symbol: t('names.power.pole','power pole'),
    power_pole_point: t('names.power.pole','power pole'),
    power_pole_label: t('names.power.pole','power pole'),
    power_pole_transition: t('names.power.pole-transition', 'transition on pole'),
    power_pole_transformer: t('names.power.pole-transformer','transformer on pole'),
    power_pole_switch: t('names.power.pole-switch','switch on pole'),
    power_terminal: t('names.power.terminal','power terminal'),
    power_substation: t('names.power.substation','power substation'),
    power_substation_point: t('names.power.substation','power substation'),
    power_line: t('names.power.line', 'power line'),
    power_line_label: t('names.power.line', 'power line'),
    power_line_hazard: t('names.power.line-hazard', 'danger zone'),
    telecoms_line: t('names.telecom.line', 'telecom line'),
    telecoms_line_label: t('names.telecom.line', 'telecom line'),
    telecoms_mast: t('names.telecom.mast', 'telecom mast'),
    telecoms_pole_symbol: t('names.telecom.pole', 'telecom pole'),
    telecoms_pole_point: t('names.telecom.pole', 'telecom pole'),
    telecoms_pole_label: t('names.telecom.pole', 'telecom pole'),
    vegetation_forest: t('names.vegetation.forest', 'vegetation')
  }
}
