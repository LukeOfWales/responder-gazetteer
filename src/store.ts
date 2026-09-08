import { create } from 'zustand'

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  latitude: number
  longitude: number
  address?: string
  postcode?: string
  phone?: string
  website?: string
  openingHours?: string
  operator?: string
  source: string
  tags: Record<string, string>
}

export type AssetCategory =
  | 'hospital'
  | 'community_hospital'
  | 'fire_station'
  | 'police_station'
  | 'ambulance_station'
  | 'mountain_rescue'
  | 'fuel_station'
  | 'public_toilet'
  | 'defibrillator'
  | 'search_and_rescue_rv'
  | 'flood_risk'
  | 'snow_risk'
  | 'radio_repeater'
  | 'search_sector_access'
  | 'forestry_entrance'
  | 'heli_landing_site'

interface AppState {
  // Map state
  center: { lat: number; lng: number }
  zoom: number
  setCenter: (lat: number, lng: number) => void
  setZoom: (zoom: number) => void

  // Active incident
  incidentLocation: { lat: number; lng: number } | null
  setIncidentLocation: (lat: number, lng: number) => void
  clearIncidentLocation: () => void

  // Active category filter
  activeCategories: AssetCategory[]
  toggleCategory: (category: AssetCategory) => void
  setCategories: (categories: AssetCategory[]) => void

  // Asset data
  assets: Asset[]
  setAssets: (assets: Asset[]) => void
  filterAssets: (categories: AssetCategory[]) => Asset[]

  // Distance calculations
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
}

const useStore = create<AppState>((set, get) => ({
  center: { lat: 51.5, lng: -3.2 },
  zoom: 10,
  setCenter: (lat: number, lng: number) => set({ center: { lat, lng } }),
  setZoom: (zoom: number) => set({ zoom }),

  incidentLocation: null,
  setIncidentLocation: (lat: number, lng: number) => set({ incidentLocation: { lat, lng } }),
  clearIncidentLocation: () => set({ incidentLocation: null }),

  activeCategories: [],
  toggleCategory: (category: AssetCategory) =>
    set((state) => {
      const exists = state.activeCategories.includes(category)
      return {
        activeCategories: exists
          ? state.activeCategories.filter((c) => c !== category)
          : [...state.activeCategories, category],
      }
    }),
  setCategories: (categories: AssetCategory[]) => set({ activeCategories: categories }),

  assets: [],
  setAssets: (assets: Asset[]) => set({ assets }),
  filterAssets: (categories: AssetCategory[]) =>
    get().assets.filter((asset) => categories.includes(asset.category)),

  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLng = (lng2 - lng1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  },
}))

export default useStore
