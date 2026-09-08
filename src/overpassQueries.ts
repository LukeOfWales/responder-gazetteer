#!/usr/bin/env node
/**
 * Overpass API query builder for Responder Gazetteer
 * Queries OpenStreetMap data for emergency services and infrastructure
 */

/**
 * Bounding box for South East Wales
 * Approximate coordinates covering:
 * Blaenau Gwent, Torfaen, Monmouthshire, Newport, Caerphilly,
 * Merthyr Tydfil, Powys (southern), Cardiff, Vale of Glamorgan
 */
export const SOUTHEAST_WALES_BBOX = {
  south: 51.35,
  west: -3.8,
  north: 51.75,
  east: -2.8,
}

/**
 * Build Overpass QL query for a specific feature type
 */
export function buildQuery(
  tags: Record<string, string>,
  bbox: typeof SOUTHEAST_WALES_BBOX
): string {
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`
  
  let tagQuery = ''
  for (const [key, value] of Object.entries(tags)) {
    if (value) {
      tagQuery += `["${key}"="${value}"]`
    } else {
      tagQuery += `["${key}"]`
    }
  }

  return `[out:json][timeout:60];
(
  node${tagQuery}(${bboxStr});
  way${tagQuery}(${bboxStr});
  relation${tagQuery}(${bboxStr});
);
out center tags;`
}

// Feature queries - stored for reference in GitHub Actions workflow
export const featureQueries = {
  hospital: { amenity: 'hospital' },
  communityHospital: { healthcare: 'hospital' },
  fireStation: { amenity: 'fire_station' },
  policeStation: { amenity: 'police' },
  ambulanceStation: { emergency: 'ambulance_station' },
  fuelStation: { amenity: 'fuel' },
  mountainRescue: { emergency: 'mountain_rescue' },
}
