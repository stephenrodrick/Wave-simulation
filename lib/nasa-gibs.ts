// NASA GIBS satellite imagery integration
export interface ImageryLayer {
  id: string
  name: string
  description: string
  format: string
  tileUrl: string
  attribution: string
}

export class NASAImageryFetcher {
  private readonly gibsUrl = "https://map1.vis.earthdata.nasa.gov/wmts-geo/1.0.0"

  getAvailableLayers(): ImageryLayer[] {
    return [
      {
        id: "MODIS_Aqua_CorrectedReflectance_TrueColor",
        name: "MODIS Aqua True Color",
        description: "True color satellite imagery from MODIS Aqua",
        format: "jpg",
        tileUrl: `${this.gibsUrl}/MODIS_Aqua_CorrectedReflectance_TrueColor/default/{time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        attribution: "NASA GIBS",
      },
      {
        id: "MODIS_Terra_CorrectedReflectance_TrueColor",
        name: "MODIS Terra True Color",
        description: "True color satellite imagery from MODIS Terra",
        format: "jpg",
        tileUrl: `${this.gibsUrl}/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        attribution: "NASA GIBS",
      },
      {
        id: "VIIRS_SNPP_DayNightBand_ENCC",
        name: "VIIRS Day/Night Band",
        description: "Day/Night band imagery from VIIRS",
        format: "png",
        tileUrl: `${this.gibsUrl}/VIIRS_SNPP_DayNightBand_ENCC/default/{time}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`,
        attribution: "NASA GIBS",
      },
    ]
  }

  getTileUrl(layerId: string, z: number, x: number, y: number, date?: string): string {
    const layer = this.getAvailableLayers().find((l) => l.id === layerId)
    if (!layer) {
      throw new Error(`Layer ${layerId} not found`)
    }

    const dateStr = date || this.getLatestAvailableDate()
    return layer.tileUrl
      .replace("{z}", z.toString())
      .replace("{x}", x.toString())
      .replace("{y}", y.toString())
      .replace("{time}", dateStr)
  }

  private getLatestAvailableDate(): string {
    // GIBS typically has 1-2 day delay
    const date = new Date()
    date.setDate(date.getDate() - 2)
    return date.toISOString().split("T")[0]
  }

  async getAvailableDates(layerId: string): Promise<string[]> {
    // In a real implementation, this would query GIBS capabilities
    // For now, return recent dates
    const dates: string[] = []
    const today = new Date()

    for (let i = 2; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split("T")[0])
    }

    return dates
  }
}
