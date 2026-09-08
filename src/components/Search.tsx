import { useState } from 'react'
import useStore from '../store'

interface SearchResult {
  name: string
  lat: number
  lng: number
}

function Search() {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const { setCenter, setZoom } = useStore()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      // Bias results to the UK to keep postcode/place searches relevant
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await response.json()

      const formatted: SearchResult[] = data.map((item: { display_name: string; lat: string; lon: string }) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }))

      setResults(formatted)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (lat: number, lng: number) => {
    setCenter(lat, lng)
    setZoom(13)
    setShowResults(false)
    setQuery('')
  }

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          inputMode="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(false)
          }}
          placeholder="Search place, postcode, town..."
          className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold active:bg-blue-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? '…' : 'Go'}
        </button>
      </form>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[1200]">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No results found.</div>
          ) : (
            results.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleResultClick(result.lat, result.lng)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 active:bg-blue-100 border-b border-gray-100 last:border-0"
              >
                <div className="text-sm text-gray-800">{result.name}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Search
