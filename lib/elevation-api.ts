// OpenTopography and elevation data integration - FIXED
import type { BoundingBox } from "./bounding-box"

export interface ElevationPoint {
  lat: number
  lng: number
  elevation: number
}

export interface DEMData {
  width: number
  height: number
  bounds: BoundingBox
  elevations: number[][]
  resolution: number
}

export class ElevationDataFetcher {
  private readonly openElevationUrl = "https://api.open-elevation.com/api/v1/lookup"
  private readonly timeout = 30000 // 30 seconds

  async fetchElevationGrid(bbox: BoundingBox, resolution = 0.002): Promise<DEMData> {
    try {
      console.log("Fetching elevation data for bbox:", bbox)

      // Use Open-Elevation API (free, no key required)
      return await this.fetchFromOpenElevation(bbox, resolution)
    } catch (error) {
      console.error("Elevation fetch failed, using flat terrain:", error)
      // Return flat terrain as fallback
      return this.generateFlatTerrain(bbox, resolution)
    }
  }

  private async fetchFromOpenElevation(bbox: BoundingBox, resolution: number): Promise<DEMData> {
    const latRange = bbox.north - bbox.south
    const lngRange = bbox.east - bbox.west
    const latSteps = Math.min(Math.ceil(latRange / resolution), 20) // Limit to 20x20 grid
    const lngSteps = Math.min(Math.ceil(lngRange / resolution), 20)

    console.log(`Creating ${latSteps}x${lngSteps} elevation grid`)

    const elevations: number[][] = []
    const batchSize = 50 // API rate limiting

    for (let i = 0; i < latSteps; i++) {
      const row: number[] = []
      const lat = bbox.south + (i * latRange) / (latSteps - 1)

      // Process in batches to avoid overwhelming the API
      for (let j = 0; j < lngSteps; j += batchSize) {
        const batch: Array<{ latitude: number; longitude: number }> = []

        for (let k = j; k < Math.min(j + batchSize, lngSteps); k++) {
          const lng = bbox.west + (k * lngRange) / (lngSteps - 1)
          batch.push({ latitude: lat, longitude: lng })
        }

        try {
          const batchElevations = await this.fetchElevationBatch(batch)
          row.push(...batchElevations)

          // Rate limiting delay
          if (j + batchSize < lngSteps) {
            await new Promise((resolve) => setTimeout(resolve, 200))
          }
        } catch (error) {
          console.warn(`Elevation batch failed for row ${i}, batch ${j}:`, error)
          // Fill with zeros as fallback
          row.push(...new Array(batch.length).fill(0))
        }
      }

      elevations.push(row)
    }

    console.log(`Fetched elevation data: ${elevations.length}x${elevations[0]?.length || 0}`)

    return {
      width: lngSteps,
      height: latSteps,
      bounds: bbox,
      elevations,
      resolution,
    }
  }

  private async fetchElevationBatch(points: Array<{ latitude: number; longitude: number }>): Promise<number[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.openElevationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locations: points,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Elevation API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid elevation API response")
      }

      return data.results.map((result: any) => {
        const elevation = result.elevation
        return typeof elevation === "number" && !isNaN(elevation) ? elevation : 0
      })
    } catch (error) {
      console.warn("Elevation API batch failed:", error)
      // Return zero elevation as fallback
      return new Array(points.length).fill(0)
    }
  }

  async fetchPointElevation(lat: number, lng: number): Promise<number> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.openElevationUrl}?locations=${lat},${lng}`, { signal: controller.signal })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Elevation API error: ${response.status}`)
      }

      const data = await response.json()
      return data.results?.[0]?.elevation || 0
    } catch (error) {
      console.warn("Point elevation fetch failed:", error)
      return 0
    }
  }

  private generateFlatTerrain(bbox: BoundingBox, resolution: number): DEMData {
    console.log("Generating flat terrain as fallback")

    const latRange = bbox.north - bbox.south
    const lngRange = bbox.east - bbox.west
    const latSteps = Math.ceil(latRange / resolution)
    const lngSteps = Math.ceil(lngRange / resolution)

    const elevations: number[][] = []
    for (let i = 0; i < latSteps; i++) {
      elevations.push(new Array(lngSteps).fill(0))
    }

    return {
      width: lngSteps,
      height: latSteps,
      bounds: bbox,
      elevations,
      resolution,
    }
  }

  // Convert elevation data to terrain mesh format
  generateTerrainMesh(demData: DEMData): {
    vertices: Float32Array
    indices: Uint32Array
    normals: Float32Array
  } {
    const { width, height, elevations, bounds } = demData
    const vertices: number[] = []
    const indices: number[] = []
    const normals: number[] = []

    // Generate vertices
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const lat = bounds.south + (i / (height - 1)) * (bounds.north - bounds.south)
        const lng = bounds.west + (j / (width - 1)) * (bounds.east - bounds.west)
        const elevation = elevations[i]?.[j] || 0

        // Convert to local coordinates (meters)
        const x = (lng - bounds.west) * 111320 * Math.cos((lat * Math.PI) / 180)
        const y = (lat - bounds.south) * 110540
        const z = elevation

        vertices.push(x, y, z)
      }
    }

    // Generate indices for triangles
    for (let i = 0; i < height - 1; i++) {
      for (let j = 0; j < width - 1; j++) {
        const topLeft = i * width + j
        const topRight = i * width + (j + 1)
        const bottomLeft = (i + 1) * width + j
        const bottomRight = (i + 1) * width + (j + 1)

        // Two triangles per quad
        indices.push(topLeft, bottomLeft, topRight)
        indices.push(topRight, bottomLeft, bottomRight)
      }
    }

    // Calculate normals (simplified)
    for (let i = 0; i < vertices.length; i += 3) {
      normals.push(0, 0, 1) // Simplified upward normal
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint32Array(indices),
      normals: new Float32Array(normals),
    }
  }
}
