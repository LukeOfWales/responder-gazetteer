#!/usr/bin/env node
/**
 * Fetch data from Overpass API and save to JSON
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { SOUTHEAST_WALES_BBOX, buildQuery, featureQueries } from './overpassQueries.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

interface OverpassFeature {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

interface OverpassResult {
  version: number
  generator: string
  elements: OverpassFeature[]
}

interface Asset {
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
  source: string
  tags: Record<string, string>
}

// Curated entries may declare OSM ids they supersede
interface CuratedAsset extends Asset {
  replaces?: string[]
}

/**
 * Fetch data from Overpass API
 */
async function fetchOverpassData(query: string): Promise<OverpassResult> {
  const maxRetries = 3
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Rotate through mirrors across attempts
    const endpoint = OVERPASS_ENDPOINTS[(attempt - 1) % OVERPASS_ENDPOINTS.length]

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ResponderGazetteer/0.1 (4x4 Response Wales operational tool)',
        },
        body: `data=${encodeURIComponent(query)}`,
      })

      // Retry on transient server/rate-limit errors
      if (response.status === 429 || response.status === 502 || response.status === 504) {
        throw new Error(`Transient Overpass error: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        const backoff = attempt * 5000
        console.log(`  Attempt ${attempt} failed (${endpoint}), retrying in ${backoff / 1000}s...`)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }
    }
  }

  throw lastError
}

/**
 * Extract coordinates from feature (handles nodes, ways with center, relations with center)
 */
function getCoordinates(feature: OverpassFeature): { lat: number; lng: number } | null {
  if (feature.type === 'node') {
    return { lat: feature.lat!, lng: feature.lon! }
  }
  if (feature.center) {
    return { lat: feature.center.lat, lng: feature.center.lon }
  }
  return null
}

/**
 * Extract address information from tags
 */
function extractAddress(tags: Record<string, string>): {
  address?: string
  postcode?: string
} {
  const addressParts = []
  
  if (tags['addr:housenumber'] && tags['addr:street']) {
    addressParts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`)
  } else if (tags['addr:street']) {
    addressParts.push(tags['addr:street'])
  }

  if (tags['addr:postcode']) {
    return {
      address: addressParts.join(', '),
      postcode: tags['addr:postcode'],
    }
  }

  return {
    address: addressParts.join(', '),
  }
}

/**
 * Strip tags that carry personal data before publishing.
 *
 * OSM sometimes records named individuals' email addresses (e.g. a specific
 * officer or contact). Republishing those in a public repo is a data-protection
 * concern, so we drop personal-looking contacts while keeping generic role/org
 * inboxes and non-PII tags.
 */
function sanitizeTags(tags: Record<string, string>): Record<string, string> {
  const clean: Record<string, string> = {}

  // Tag keys that commonly hold personal contact details - dropped entirely.
  const dropKeys = /^(email|contact:email|contact:facebook|contact:twitter|contact:instagram|contact:linkedin|fax|contact:fax)$/i

  // Heuristic: an email addressed to a named person (contains a dot or
  // hyphen in the local part, e.g. "jane.doe@" or "j-doe@") is treated as
  // PII; generic inboxes (info@, hello@, enquiries@) are kept.
  const looksPersonalEmail = (value: string): boolean => {
    const match = value.match(/([a-zA-Z0-9._%+-]+)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (!match) return false
    const local = match[1].toLowerCase()
    const genericInbox =
      /^(info|hello|enquir|contact|admin|office|reception|general|support|sales|bookings?|peopleservices|customer|help|mail|post|team)/
    if (genericInbox.test(local)) return false
    // Purely numeric local parts (e.g. store IDs like 2288@) are not personal.
    if (/^\d+$/.test(local)) return false
    // A separator in the local part usually indicates first.last / first-last.
    return /[._-]/.test(local)
  }

  for (const [key, value] of Object.entries(tags)) {
    if (dropKeys.test(key)) continue
    if (looksPersonalEmail(value)) continue
    clean[key] = value
  }

  return clean
}

/**
 * Transform Overpass feature to Asset format
 */
function transformFeature(
  feature: OverpassFeature,
  category: string
): Asset | null {
  const coords = getCoordinates(feature)
  if (!coords) {
    console.warn(`Skipping ${feature.type} ${feature.id}: No coordinates`)
    return null
  }

  const { address, postcode } = extractAddress(feature.tags)
  const tags = sanitizeTags(feature.tags)

  return {
    id: `${feature.type}_${feature.id}`,
    name: feature.tags.name || '',
    category,
    latitude: coords.lat,
    longitude: coords.lng,
    address: address,
    postcode: postcode,
    phone:
      feature.tags['contact:phone'] ||
      feature.tags['phone'] ||
      feature.tags['emergency:phone'],
    website:
      feature.tags['website'] ||
      feature.tags['contact:website'] ||
      feature.tags['url'],
    openingHours:
      feature.tags['opening_hours'] ||
      feature.tags['opening_hours:covid19'],
    operator: feature.tags['operator'],
    source: 'OpenStreetMap',
    tags: tags,
  }
}

/**
 * Fetch and save data for a single query. Returns the assets so the
 * caller can also build a merged gazetteer file.
 */
async function fetchAndSave(
  name: string,
  category: string,
  outputFile: string,
  tags: Record<string, string>
): Promise<Asset[]> {
  console.log(`Fetching ${name}...`)

  try {
    const query = buildQuery(tags, SOUTHEAST_WALES_BBOX)
    const result = await fetchOverpassData(query)

    const assets = result.elements
      .map((feature) => transformFeature(feature, category))
      .filter((asset): asset is Asset => asset !== null)

    const outputPath = path.join(__dirname, '..', outputFile)

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(outputPath, JSON.stringify(assets, null, 2))

    console.log(`  Saved ${assets.length} ${name} to ${outputFile}`)
    return assets
  } catch (error) {
    console.error(`  Error fetching ${name}:`, error)

    // Fall back to the last successfully-saved file so a transient failure
    // doesn't wipe a whole category from the merged gazetteer.
    const outputPath = path.join(__dirname, '..', outputFile)
    if (fs.existsSync(outputPath)) {
      try {
        const previous: Asset[] = JSON.parse(fs.readFileSync(outputPath, 'utf8'))
        console.log(`  Using ${previous.length} previously-saved ${name}`)
        return previous
      } catch {
        // fall through
      }
    }
    return []
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

// Human-readable label per category, used when naming after a place
const categoryLabels: Record<string, string> = {
  hospital: 'Hospital',
  community_hospital: 'Community Hospital',
  fire_station: 'Fire Station',
  police_station: 'Police Station',
  ambulance_station: 'Ambulance Station',
  fuel_station: 'Fuel Station',
  mountain_rescue: 'Mountain Rescue',
}

/**
 * Reverse-geocode a coordinate to the nearest town/village/suburb name.
 * Returns undefined if nothing useful is found.
 */
async function reverseGeocodePlace(
  lat: number,
  lng: number
): Promise<string | undefined> {
  const url = `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ResponderGazetteer/0.1 (4x4 Response Wales operational tool)',
      },
    })
    if (!response.ok) return undefined
    const data = await response.json()
    const a = data.address ?? {}
    // Prefer the most specific settlement name available
    return (
      a.town ||
      a.village ||
      a.suburb ||
      a.city ||
      a.hamlet ||
      a.municipality ||
      a.county ||
      undefined
    )
  } catch {
    return undefined
  }
}

/**
 * Fill in names for unnamed assets using reverse geocoding.
 * Uses a persistent cache keyed by rounded coordinates to avoid
 * re-querying Nominatim on every run (and to respect its usage policy).
 */
async function nameUnnamedAssets(assets: Asset[]): Promise<void> {
  const cachePath = path.join(__dirname, '..', 'data', 'placecache.json')
  let cache: Record<string, string> = {}
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    } catch {
      cache = {}
    }
  }

  const unnamed = assets.filter((a) => !a.name && a.source === 'OpenStreetMap')
  if (unnamed.length === 0) return

  console.log(`\nNaming ${unnamed.length} unnamed assets via reverse geocoding...`)

  for (const asset of unnamed) {
    const key = `${asset.latitude.toFixed(4)},${asset.longitude.toFixed(4)}`
    let place = cache[key]

    if (place === undefined) {
      place = (await reverseGeocodePlace(asset.latitude, asset.longitude)) ?? ''
      cache[key] = place
      // Nominatim usage policy: max 1 request/second
      await sleep(1100)
    }

    const label = categoryLabels[asset.category] ?? 'Facility'
    asset.name = place ? `${label} near ${place}` : `Unnamed ${label}`
  }

  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))
  console.log(`  Named ${unnamed.length} assets (cache: ${Object.keys(cache).length} entries)`)
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('Starting data fetch from Overpass API...')
  console.log(`Bounding box: ${SOUTHEAST_WALES_BBOX.south},${SOUTHEAST_WALES_BBOX.west},${SOUTHEAST_WALES_BBOX.north},${SOUTHEAST_WALES_BBOX.east}`)
  console.log('')

  const queries = [
    { name: 'Hospitals', category: 'hospital', outputFile: 'data/hospitals.json', tags: featureQueries.hospital },
    { name: 'Community Hospitals', category: 'community_hospital', outputFile: 'data/community_hospitals.json', tags: featureQueries.communityHospital },
    { name: 'Fire Stations', category: 'fire_station', outputFile: 'data/firestations.json', tags: featureQueries.fireStation },
    { name: 'Police Stations', category: 'police_station', outputFile: 'data/police.json', tags: featureQueries.policeStation },
    { name: 'Ambulance Stations', category: 'ambulance_station', outputFile: 'data/ambulance.json', tags: featureQueries.ambulanceStation },
    { name: 'Fuel Stations', category: 'fuel_station', outputFile: 'data/fuel.json', tags: featureQueries.fuelStation },
    { name: 'Mountain Rescue', category: 'mountain_rescue', outputFile: 'data/mountain_rescue.json', tags: featureQueries.mountainRescue },
  ]

  // Run sequentially with a short delay to respect the public Overpass endpoint
  let all: Asset[] = []
  for (const q of queries) {
    const assets = await fetchAndSave(q.name, q.category, q.outputFile, q.tags)
    all = all.concat(assets)
    await sleep(1500)
  }

  // Merge manually-curated assets (MRT bases, facilities poorly represented
  // or mis-categorised in OSM). Curated entries may declare `replaces` to
  // supersede specific OSM ids and avoid duplicate markers.
  const curatedPath = path.join(__dirname, '..', 'data', 'curated.json')
  if (fs.existsSync(curatedPath)) {
    try {
      const curated: CuratedAsset[] = JSON.parse(fs.readFileSync(curatedPath, 'utf8'))

      // Collect all OSM ids that curated entries supersede
      const superseded = new Set<string>()
      for (const c of curated) {
        for (const id of c.replaces ?? []) superseded.add(id)
      }

      const byId = new Map<string, Asset>()
      for (const a of all) {
        if (!superseded.has(a.id)) byId.set(a.id, a)
      }
      for (const c of curated) {
        // Store the curated asset without the pipeline-only `replaces` field
        const { replaces: _replaces, ...asset } = c
        byId.set(asset.id, asset)
      }
      all = Array.from(byId.values())
      console.log(`\nMerged ${curated.length} curated assets (superseded ${superseded.size} OSM entries)`)
    } catch (error) {
      console.error('Error reading curated.json:', error)
    }
  }

  // Fill in names for unnamed OSM assets using the nearest settlement
  await nameUnnamedAssets(all)

  // Write combined gazetteer to public/data so the frontend can fetch it at runtime
  const publicDir = path.join(__dirname, '..', 'public', 'data')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  const gazetteerPath = path.join(publicDir, 'gazetteer.json')
  fs.writeFileSync(gazetteerPath, JSON.stringify(all, null, 2))

  console.log(`\nWrote ${all.length} total assets to public/data/gazetteer.json`)
  console.log('Data fetch complete!')
}

main().catch(console.error)
