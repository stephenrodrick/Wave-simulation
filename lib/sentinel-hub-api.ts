// Sentinel Hub satellite imagery integration
export interface SentinelImageryLayer {
  id: string
  name: string
  description: string
  collection: string
  bands: string[]
  resolution: number
}

export interface SentinelImageRequest {
  bbox: [number, number, number, number] // [west, south, east, north]
  time: string // ISO date string
  width: number
  height: number
  format: "image/jpeg" | "image/png" | "image/tiff"
  layer: string
}

export class SentinelHubAPI {
  private readonly baseUrl = "https://services.sentinel-hub.com"
  private readonly apiKey = "37afdbc5-4be6-4193-a1fb-e10bba334e0e"
  private readonly instanceId = "your-instance-id" // You'll need to create this in Sentinel Hub

  getAvailableLayers(): SentinelImageryLayer[] {
    return [
      {
        id: "TRUE_COLOR",
        name: "True Color (RGB)",
        description: "Natural color satellite imagery",
        collection: "sentinel-2-l2a",
        bands: ["B04", "B03", "B02"],
        resolution: 10,
      },
      {
        id: "FALSE_COLOR",
        name: "False Color (NIR)",
        description: "Near-infrared false color imagery",
        collection: "sentinel-2-l2a",
        bands: ["B08", "B04", "B03"],
        resolution: 10,
      },
      {
        id: "NDVI",
        name: "NDVI (Vegetation Index)",
        description: "Normalized Difference Vegetation Index",
        collection: "sentinel-2-l2a",
        bands: ["B08", "B04"],
        resolution: 10,
      },
      {
        id: "URBAN",
        name: "Urban Areas",
        description: "Enhanced urban area visualization",
        collection: "sentinel-2-l2a",
        bands: ["B12", "B11", "B04"],
        resolution: 20,
      },
    ]
  }

  async getImageTile(request: SentinelImageRequest): Promise<string> {
    const layer = this.getAvailableLayers().find((l) => l.id === request.layer)
    if (!layer) {
      throw new Error(`Layer ${request.layer} not found`)
    }

    const evalscript = this.generateEvalscript(layer)

    const requestBody = {
      input: {
        bounds: {
          bbox: request.bbox,
          properties: {
            crs: "http://www.opengis.net/def/crs/EPSG/0/4326",
          },
        },
        data: [
          {
            type: layer.collection,
            dataFilter: {
              timeRange: {
                from: request.time,
                to: request.time,
              },
            },
          },
        ],
      },
      output: {
        width: request.width,
        height: request.height,
        responses: [
          {
            identifier: "default",
            format: {
              type: request.format,
            },
          },
        ],
      },
      evalscript: evalscript,
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Sentinel Hub API error: ${response.status}`)
      }

      // Return the image as base64 data URL
      const imageBlob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(imageBlob)
      })
    } catch (error) {
      console.error("Sentinel Hub API error:", error)
      throw error
    }
  }

  private generateEvalscript(layer: SentinelImageryLayer): string {
    switch (layer.id) {
      case "TRUE_COLOR":
        return `
          //VERSION=3
          function setup() {
            return {
              input: ["B02", "B03", "B04"],
              output: { bands: 3 }
            };
          }
          
          function evaluatePixel(sample) {
            return [sample.B04 / 10000, sample.B03 / 10000, sample.B02 / 10000];
          }
        `

      case "FALSE_COLOR":
        return `
          //VERSION=3
          function setup() {
            return {
              input: ["B03", "B04", "B08"],
              output: { bands: 3 }
            };
          }
          
          function evaluatePixel(sample) {
            return [sample.B08 / 10000, sample.B04 / 10000, sample.B03 / 10000];
          }
        `

      case "NDVI":
        return `
          //VERSION=3
          function setup() {
            return {
              input: ["B04", "B08"],
              output: { bands: 3 }
            };
          }
          
          function evaluatePixel(sample) {
            let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
            return colorBlend(ndvi, 
              [-1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
              [[0.05, 0.05, 0.05], [0.75, 0.75, 0.75], [0.86, 0.86, 0.86], [1, 1, 0.88],
               [1, 0.95, 0.8], [0.93, 0.91, 0.71], [0.87, 0.85, 0.61], [0.8, 0.78, 0.51],
               [0.74, 0.72, 0.42], [0.69, 0.76, 0.38], [0.64, 0.8, 0.35], [0.57, 0.75, 0.32]]
            );
          }
        `

      case "URBAN":
        return `
          //VERSION=3
          function setup() {
            return {
              input: ["B04", "B11", "B12"],
              output: { bands: 3 }
            };
          }
          
          function evaluatePixel(sample) {
            return [sample.B12 / 10000, sample.B11 / 10000, sample.B04 / 10000];
          }
        `

      default:
        throw new Error(`No evalscript defined for layer ${layer.id}`)
    }
  }

  async getAvailableDates(bbox: [number, number, number, number], collection = "sentinel-2-l2a"): Promise<string[]> {
    const requestBody = {
      collections: [collection],
      bbox: bbox,
      datetime: "2023-01-01/2024-12-31",
      limit: 100,
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/catalog/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Sentinel Hub Catalog API error: ${response.status}`)
      }

      const data = await response.json()
      return data.features
        .map((feature: any) => feature.properties.datetime.split("T")[0])
        .filter((date: string, index: number, arr: string[]) => arr.indexOf(date) === index)
        .sort()
        .reverse()
        .slice(0, 30) // Last 30 available dates
    } catch (error) {
      console.error("Error fetching available dates:", error)
      // Return recent dates as fallback
      const dates: string[] = []
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i * 5) // Every 5 days
        dates.push(date.toISOString().split("T")[0])
      }
      return dates
    }
  }

  // Utility method to get tile URL for web maps
  getTileUrl(layer: string, z: number, x: number, y: number, date?: string): string {
    const dateStr = date || new Date().toISOString().split("T")[0]
    return `${this.baseUrl}/ogc/wms/${this.instanceId}?SERVICE=WMS&REQUEST=GetMap&LAYERS=${layer}&STYLES=&FORMAT=image/jpeg&TRANSPARENT=false&VERSION=1.1.1&WIDTH=256&HEIGHT=256&SRS=EPSG:3857&BBOX=${this.tileToBBox(x, y, z)}&TIME=${dateStr}`
  }

  private tileToBBox(x: number, y: number, z: number): string {
    const n = Math.pow(2, z)
    const lonLeft = (x / n) * 360 - 180
    const lonRight = ((x + 1) / n) * 360 - 180
    const latTop = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * (180 / Math.PI)
    const latBottom = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * (180 / Math.PI)

    // Convert to Web Mercator
    const leftMerc = (lonLeft * 20037508.34) / 180
    const rightMerc = (lonRight * 20037508.34) / 180
    const topMerc = ((Math.log(Math.tan(((90 + latTop) * Math.PI) / 360)) / (Math.PI / 180)) * 20037508.34) / 180
    const bottomMerc = ((Math.log(Math.tan(((90 + latBottom) * Math.PI) / 360)) / (Math.PI / 180)) * 20037508.34) / 180

    return `${leftMerc},${bottomMerc},${rightMerc},${topMerc}`
  }
}
