import L from 'leaflet'
import type { AssetCategory } from './store'

// Colour + short label per category, used for map markers and the legend.
export const categoryStyles: Record<
  AssetCategory,
  { color: string; label: string }
> = {
  hospital: { color: '#dc2626', label: 'Hospital' },
  community_hospital: { color: '#f97316', label: 'Community Hospital' },
  fire_station: { color: '#b91c1c', label: 'Fire Station' },
  police_station: { color: '#2563eb', label: 'Police Station' },
  ambulance_station: { color: '#16a34a', label: 'Ambulance Station' },
  mountain_rescue: { color: '#7c3aed', label: 'Mountain Rescue' },
  fuel_station: { color: '#ca8a04', label: 'Fuel Station' },
  public_toilet: { color: '#0891b2', label: 'Public Toilet' },
  defibrillator: { color: '#db2777', label: 'Defibrillator' },
  search_and_rescue_rv: { color: '#7c3aed', label: 'SAR RV Point' },
  flood_risk: { color: '#0ea5e9', label: 'Flood Risk' },
  snow_risk: { color: '#64748b', label: 'Snow Risk' },
  radio_repeater: { color: '#4b5563', label: 'Radio Repeater' },
  search_sector_access: { color: '#65a30d', label: 'Sector Access' },
  forestry_entrance: { color: '#166534', label: 'Forestry Entrance' },
  heli_landing_site: { color: '#9333ea', label: 'Heli Landing' },
}

const iconCache = new Map<string, L.DivIcon>()

// A teardrop pin coloured per category. Cached so we don't rebuild per marker.
export function markerIconFor(category: AssetCategory): L.DivIcon {
  const cached = iconCache.get(category)
  if (cached) return cached

  const color = categoryStyles[category]?.color ?? '#2563eb'

  const html = `
    <span style="
      display:block;
      width:20px;height:20px;
      background:${color};
      border:2px solid #ffffff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 1px 3px rgba(0,0,0,0.4);
    "></span>`

  const icon = L.divIcon({
    html,
    className: 'rg-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 22],
    popupAnchor: [0, -20],
  })

  iconCache.set(category, icon)
  return icon
}
