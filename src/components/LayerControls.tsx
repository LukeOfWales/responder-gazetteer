import useStore from '../store'

interface LayerControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright'
}

function LayerControls({ position = 'topright' }: LayerControlProps) {
  const { activeCategories, toggleCategory, setCategories } = useStore()

  const positionClasses: Record<string, string> = {
    topleft: 'top-2 left-2',
    topright: 'top-2 right-2',
    bottomleft: 'bottom-2 left-2',
    bottomright: 'bottom-2 right-2',
  }

  const allCategories = [
    { id: 'hospital', label: 'Hospitals' },
    { id: 'community_hospital', label: 'Community Hospitals' },
    { id: 'fire_station', label: 'Fire Stations' },
    { id: 'police_station', label: 'Police Stations' },
    { id: 'ambulance_station', label: 'Ambulance Stations' },
    { id: 'mountain_rescue', label: 'Mountain Rescue' },
    { id: 'fuel_station', label: 'Fuel Stations' },
  ]

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setCategories(allCategories.map((c) => c.id) as any)
    } else {
      setCategories([])
    }
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-[1000]`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={activeCategories.length === allCategories.length && allCategories.length > 0}
            onChange={(e) => toggleAll(e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="font-semibold text-sm">All Layers</label>
        </div>
        
        <div className="space-y-1">
          {allCategories.map((category) => {
            const isChecked = activeCategories.includes(category.id as any)
            return (
              <label key={category.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCategory(category.id as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm">{category.label}</span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LayerControls
