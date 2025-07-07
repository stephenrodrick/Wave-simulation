export interface BoundingBox {
  south: number
  west: number
  north: number
  east: number
}

export function createBoundingBox(lat: number, lng: number, radiusKm: number): BoundingBox {
  // Convert radius from km to degrees (approximate)
  const latDelta = radiusKm / 111.32 // 1 degree lat ≈ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180)) // Adjust for longitude

  return {
    south: lat - latDelta,
    west: lng - lngDelta,
    north: lat + latDelta,
    east: lng + lngDelta,
  }
}

export function isValidBoundingBox(bbox: BoundingBox): boolean {
  return (
    bbox.south < bbox.north &&
    bbox.west < bbox.east &&
    bbox.south >= -90 &&
    bbox.north <= 90 &&
    bbox.west >= -180 &&
    bbox.east <= 180
  )
}

export function getBoundingBoxCenter(bbox: BoundingBox): [number, number] {
  return [(bbox.north + bbox.south) / 2, (bbox.east + bbox.west) / 2]
}

export function getBoundingBoxSize(bbox: BoundingBox): { width: number; height: number } {
  return {
    width: bbox.east - bbox.west,
    height: bbox.north - bbox.south,
  }
}
