import useStore from '../store'
import { formatDistance } from '../utils/distance'

interface IncidentModeProps {
  onClose: () => void
}

function IncidentMode({ onClose }: IncidentModeProps) {
  const {
    setCategories,
    incidentLocation,
    clearIncidentLocation,
    assets,
    calculateDistance,
  } = useStore()

  // Find nearest asset per category relative to the incident location
  const nearestByCategory = () => {
    if (!incidentLocation) return []

    const categories = [
      { id: 'hospital', label: 'Nearest Hospital' },
      { id: 'fire_station', label: 'Nearest Fire Station' },
      { id: 'police_station', label: 'Nearest Police' },
      { id: 'fuel_station', label: 'Nearest Fuel' },
      { id: 'mountain_rescue', label: 'Nearest MRT' },
    ]

    return categories
      .map(({ id, label }) => {
        const inCategory = assets.filter((a) => a.category === id)
        if (inCategory.length === 0) return null

        let nearest = inCategory[0]
        let nearestDist = calculateDistance(
          incidentLocation.lat,
          incidentLocation.lng,
          nearest.latitude,
          nearest.longitude
        )

        for (const asset of inCategory) {
          const dist = calculateDistance(
            incidentLocation.lat,
            incidentLocation.lng,
            asset.latitude,
            asset.longitude
          )
          if (dist < nearestDist) {
            nearest = asset
            nearestDist = dist
          }
        }

        return { label, name: nearest.name, distance: nearestDist }
      })
      .filter((r): r is { label: string; name: string; distance: number } => r !== null)
  }

  const results = nearestByCategory()

  return (
    <div className="absolute top-24 left-4 z-[1000]">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">Incident Mode</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {!incidentLocation ? (
          <p className="text-sm text-gray-600">
            Click anywhere on the map to drop a pin at the incident location. The
            system will show radius rings and list the nearest facilities.
          </p>
        ) : (
          <>
            <div className="text-sm text-green-700 font-semibold mb-2">
              Incident set: {incidentLocation.lat.toFixed(4)},{' '}
              {incidentLocation.lng.toFixed(4)}
            </div>

            <div className="mb-3 space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">Nearest facilities:</h3>
              {results.length === 0 ? (
                <p className="text-xs text-gray-500">No facilities loaded.</p>
              ) : (
                results.map((r) => (
                  <div key={r.label} className="text-xs flex justify-between gap-2">
                    <span className="text-gray-700">{r.label}:</span>
                    <span className="font-medium text-right">
                      {r.name} ({formatDistance(r.distance)})
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={clearIncidentLocation}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-center"
            >
              Clear incident
            </button>
          </>
        )}

        <div className="mt-3 pt-3 border-t">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick Layer Presets:</h3>
          <div className="space-y-1">
            <button
              onClick={() =>
                setCategories(['hospital', 'fire_station', 'police_station', 'fuel_station'])
              }
              className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1"
            >
              Emergency services (hospitals, fire, police, fuel)
            </button>
            <button
              onClick={() => setCategories(['mountain_rescue'])}
              className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1"
            >
              Mountain Rescue only
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncidentMode
