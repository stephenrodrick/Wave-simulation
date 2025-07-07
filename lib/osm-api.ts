// OpenStreetMap Overpass API integration - FIXED
export interface OSMBuilding {
  id: string
  type: "way" | "relation"
  coordinates: number[][]
  tags: {
    building?: string
    height?: string
    "building:levels"?: string
    name?: string
    amenity?: string
  }
  calculatedHeight: number
}

export interface OSMRoad {
  id: string
  coordinates: number[][]
  tags: {
    highway: string
    name?: string
    width?: string
  }
}

export interface BoundingBox {
  south: number
  west: number
  north: number
  east: number
}

export class OSMDataFetcher {
  private readonly overpassUrl = "https://overpass-api.de/api/interpreter"
  private readonly timeout = 30000 // 30 seconds

  async fetchBuildings(bbox: BoundingBox): Promise<OSMBuilding[]> {
    const query = `
      [out:json][timeout:25];
      (
        way["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        relation["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      );
      out body;
      >;
      out skel qt;
    `

    try {
      console.log("Fetching OSM buildings for bbox:", bbox)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.overpassUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("OSM buildings response:", data)

      const buildings = this.processBuildings(data)
      console.log(`Processed ${buildings.length} buildings`)

      return buildings
    } catch (error) {
      console.error("Error fetching OSM buildings:", error)

      // Return mock data as fallback
      return this.generateMockBuildings(bbox)
    }
  }

  async fetchRoads(bbox: BoundingBox): Promise<OSMRoad[]> {
    const query = `
      [out:json][timeout:25];
      (
        way["highway"~"^(primary|secondary|tertiary|residential|trunk|motorway)$"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      );
      out body;
      >;
      out skel qt;
    `

    try {
      console.log("Fetching OSM roads for bbox:", bbox)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.overpassUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("OSM roads response:", data)

      const roads = this.processRoads(data)
      console.log(`Processed ${roads.length} roads`)

      return roads
    } catch (error) {
      console.error("Error fetching OSM roads:", error)

      // Return mock data as fallback
      return this.generateMockRoads(bbox)
    }
  }

  private processBuildings(osmData: any): OSMBuilding[] {
    if (!osmData.elements || !Array.isArray(osmData.elements)) {
      console.warn("Invalid OSM data structure")
      return []
    }

    const nodes = new Map()
    const buildings: OSMBuilding[] = []

    // First pass: collect all nodes
    osmData.elements.forEach((element: any) => {
      if (element.type === "node" && element.lat && element.lon) {
        nodes.set(element.id, [element.lon, element.lat])
      }
    })

    // Second pass: process ways and relations
    osmData.elements.forEach((element: any) => {
      if ((element.type === "way" || element.type === "relation") && element.tags?.building) {
        const coordinates: number[][] = []

        if (element.type === "way" && element.nodes && Array.isArray(element.nodes)) {
          element.nodes.forEach((nodeId: number) => {
            const coord = nodes.get(nodeId)
            if (coord) coordinates.push(coord)
          })
        }

        if (coordinates.length >= 3) {
          // Need at least 3 points for a building
          const height = this.calculateBuildingHeight(element.tags)

          buildings.push({
            id: element.id.toString(),
            type: element.type,
            coordinates,
            tags: element.tags,
            calculatedHeight: height,
          })
        }
      }
    })

    return buildings
  }

  private processRoads(osmData: any): OSMRoad[] {
    if (!osmData.elements || !Array.isArray(osmData.elements)) {
      console.warn("Invalid OSM data structure")
      return []
    }

    const nodes = new Map()
    const roads: OSMRoad[] = []

    // Collect nodes
    osmData.elements.forEach((element: any) => {
      if (element.type === "node" && element.lat && element.lon) {
        nodes.set(element.id, [element.lon, element.lat])
      }
    })

    // Process ways
    osmData.elements.forEach((element: any) => {
      if (element.type === "way" && element.tags?.highway && element.nodes) {
        const coordinates: number[][] = []

        element.nodes.forEach((nodeId: number) => {
          const coord = nodes.get(nodeId)
          if (coord) coordinates.push(coord)
        })

        if (coordinates.length >= 2) {
          // Need at least 2 points for a road
          roads.push({
            id: element.id.toString(),
            coordinates,
            tags: element.tags,
          })
        }
      }
    })

    return roads
  }

  private calculateBuildingHeight(tags: any): number {
    // Try explicit height first
    if (tags.height) {
      const height = Number.parseFloat(tags.height.replace(/[^\d.]/g, ""))
      if (!isNaN(height) && height > 0) return height
    }

    // Estimate from building levels
    if (tags["building:levels"]) {
      const levels = Number.parseInt(tags["building:levels"])
      if (!isNaN(levels) && levels > 0) return levels * 3.5 // Assume 3.5m per level
    }

    // Default heights by building type
    const buildingType = tags.building
    const defaultHeights: Record<string, number> = {
      house: 8,
      residential: 12,
      apartments: 25,
      commercial: 15,
      office: 30,
      industrial: 12,
      warehouse: 10,
      hospital: 20,
      school: 12,
      church: 15,
      yes: 10, // Generic building
    }

    return defaultHeights[buildingType] || 10
  }

  private generateMockBuildings(bbox: BoundingBox): OSMBuilding[] {
    console.log("Generating mock buildings as fallback")
    const buildings: OSMBuilding[] = []
    const centerLat = (bbox.north + bbox.south) / 2
    const centerLng = (bbox.east + bbox.west) / 2

    for (let i = 0; i < 15; i++) {
      const lat = centerLat + (Math.random() - 0.5) * (bbox.north - bbox.south) * 0.8
      const lng = centerLng + (Math.random() - 0.5) * (bbox.east - bbox.west) * 0.8
      const size = Math.random() * 0.001 + 0.0005

      buildings.push({
        id: `mock_building_${i}`,
        type: "way",
        coordinates: [
          [lng - size, lat - size],
          [lng + size, lat - size],
          [lng + size, lat + size],
          [lng - size, lat + size],
          [lng - size, lat - size],
        ],
        tags: {
          building: ["residential", "commercial", "office", "industrial"][Math.floor(Math.random() * 4)],
          "building:levels": Math.floor(Math.random() * 10 + 1).toString(),
        },
        calculatedHeight: Math.random() * 50 + 10,
      })
    }

    return buildings
  }

  private generateMockRoads(bbox: BoundingBox): OSMRoad[] {
    console.log("Generating mock roads as fallback")
    const roads: OSMRoad[] = []
    const centerLat = (bbox.north + bbox.south) / 2
    const centerLng = (bbox.east + bbox.west) / 2

    for (let i = 0; i < 8; i++) {
      const startLat = centerLat + (Math.random() - 0.5) * (bbox.north - bbox.south) * 0.6
      const startLng = centerLng + (Math.random() - 0.5) * (bbox.east - bbox.west) * 0.6
      const endLat = startLat + (Math.random() - 0.5) * 0.006
      const endLng = startLng + (Math.random() - 0.5) * 0.006

      roads.push({
        id: `mock_road_${i}`,
        coordinates: [
          [startLng, startLat],
          [endLng, endLat],
        ],
        tags: {
          highway: ["primary", "secondary", "residential", "tertiary"][Math.floor(Math.random() * 4)],
        },
      })
    }

    return roads
  }
}
