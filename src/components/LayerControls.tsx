import { useState } from 'react'
import useStore, { type AssetCategory } from '../store'
import { categoryStyles } from '../markerIcons'

const allCategories: { id: AssetCategory; label: string }[] = [
  { id: 'hospital', label: 'Hospitals' },
  { id: 'community_hospital', label: 'Community Hospitals' },
  { id: 'fire_station', label: 'Fire Stations' },
  { id: 'police_station', label: 'Police Stations' },
  { id: 'ambulance_station', label: 'Ambulance Stations' },
  { id: 'mountain_rescue', label: 'Mountain Rescue' },
  { id: 'fuel_station', label: 'Fuel Stations' },
]

function LayerControls() {
  const { activeCategories, toggleCategory, setCategories } = useStore()
  const [open, setOpen] = useState(false)

  const allOn =
    activeCategories.length === allCategories.length && allCategories.length > 0

  const toggleAll = (checked: boolean) => {
    setCategories(checked ? allCategories.map((c) => c.id) : [])
  }

  return (
    <div className="absolute top-2 right-2 z-[1000]">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white text-gray-800 rounded-lg shadow-lg px-3 py-2 font-semibold text-sm border border-gray-200 active:bg-gray-100"
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        Layers
      </button>

      {open && (
        <div className="mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64 max-h-[70vh] overflow-y-auto">
          <label className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={allOn}
              onChange={(e) => toggleAll(e.target.checked)}
              className="h-5 w-5 accent-blue-600"
            />
            <span className="font-semibold text-sm text-gray-800">All Layers</span>
          </label>

          <div className="space-y-0.5">
            {allCategories.map((category) => {
              const isChecked = activeCategories.includes(category.id)
              return (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-2"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(category.id)}
                    className="h-5 w-5 accent-blue-600"
                  />
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryStyles[category.id].color }}
                  />
                  <span className="text-sm text-gray-800">{category.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LayerControls
