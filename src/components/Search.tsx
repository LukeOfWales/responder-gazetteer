import { useState } from 'react'
import useStore from '../store'

function Search() {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<{ name: string; lat: number; lng: number }[]>([])

  const { setCenter, setZoom } = useStore()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    try {
      // Use Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await response.json()

      const formattedResults = data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }))

      setResults(formattedResults)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleResultClick = (lat: number, lng: number) => {
    setCenter(lat, lng)
    setZoom(13)
    setShowResults(false)
    setQuery('')
  }

  return (
    <div className="absolute top-4 left-4 z-[1000] w-full max-w-sm">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(false)
          }}
          placeholder="Search for location, postcode, or place..."
          className="w-full px-4 py-3 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onFocus={() => query && setShowResults(true)}
        />
        
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden">
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleResultClick(result.lat, result.lng)}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-200 last:border-0 transition-colors"
              >
                <div className="font-medium text-sm">{result.name}</div>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}

export default Search
