import useStore from '../store'
import { formatDistance } from '../utils/distance'

interface AssetCardProps {
  asset: {
    id: string
    name: string
    category: string
    latitude: number
    longitude: number
    address?: string
    postcode?: string
    phone?: string
    website?: string
    openingHours?: string
    operator?: string
  }
  incidentLat: number | null
  incidentLng: number | null
  onClose: () => void
}

function AssetCard({ asset, incidentLat, incidentLng, onClose }: AssetCardProps) {
  const { calculateDistance } = useStore()

  const straightLineKm =
    incidentLat && incidentLng
      ? calculateDistance(incidentLat, incidentLng, asset.latitude, asset.longitude)
      : null

  const categoryLabel = asset.category.replace(/_/g, ' ')

  return (
    <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-2xl p-4 max-h-[70vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{asset.name}</h3>
          <p className="text-xs text-gray-500 capitalize">{categoryLabel}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {straightLineKm !== null && (
          <div className="bg-blue-50 rounded px-2 py-1">
            <span className="font-semibold">Distance from incident:</span>{' '}
            {formatDistance(straightLineKm)} (straight line)
          </div>
        )}

        {(asset.address || asset.postcode) && (
          <div>
            <span className="font-semibold">Address:</span>{' '}
            {[asset.address, asset.postcode].filter(Boolean).join(', ')}
          </div>
        )}

        {asset.operator && (
          <div>
            <span className="font-semibold">Operator:</span> {asset.operator}
          </div>
        )}

        {asset.phone && (
          <div>
            <span className="font-semibold">Phone:</span>{' '}
            <a href={`tel:${asset.phone}`} className="text-blue-600 hover:underline">
              {asset.phone}
            </a>
          </div>
        )}

        {asset.website && (
          <div className="truncate">
            <span className="font-semibold">Website:</span>{' '}
            <a
              href={asset.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {asset.website}
            </a>
          </div>
        )}

        {asset.openingHours && (
          <div>
            <span className="font-semibold">Opening Hours:</span> {asset.openingHours}
          </div>
        )}

        <div className="text-xs text-gray-400 pt-1">
          {asset.latitude.toFixed(5)}, {asset.longitude.toFixed(5)}
        </div>

        {/* Navigate is always available - responders may want directions
            regardless of whether an incident pin is set */}
        <div className="pt-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${asset.latitude},${asset.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-center font-semibold"
          >
            Navigate
          </a>
        </div>
      </div>
    </div>
  )
}

export default AssetCard
