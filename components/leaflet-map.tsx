"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Satellite, Calendar, Download, Maximize2, Eye, EyeOff, Cloud, Loader2 } from "lucide-react"
import { NASAImageryAPI, type NASAImageryLayer } from "@/lib/nasa-api"
import type { OSMBuilding, OSMRoad } from "@/lib/osm-api"
import type { DEMData } from "@/lib/elevation-api"

interface LeafletMapProps {
  center: [number, number]
  zoom: number
  buildings?: OSMBuilding[]
  roads?: OSMRoad[]
  elevation?: DEMData | null
  explosiveParams?: {
    type: string
    mass: number
    coordinates: [number, number]
  }
  showBlastRadius?: boolean
  onMapClick?: (lat: number, lng: number) => void
}

export function LeafletMap({
  center,
  zoom,
  buildings = [],
  roads = [],
  elevation,
  explosiveParams,
  showBlastRadius = false,
  onMapClick,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [selectedLayer, setSelectedLayer] = useState<string>("MODIS_Terra_CorrectedReflectance_TrueColor")
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [layerOpacity, setLayerOpacity] = useState<number>(80)
  const [showBuildings, setShowBuildings] = useState(true)
  const [showRoads, setShowRoads] = useState(true)
  const [showElevation, setShowElevation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [nasaLayers, setNasaLayers] = useState<NASAImageryLayer[]>([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const nasaAPI = new NASAImageryAPI()

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        setIsLoading(true)
        setMapError(null)

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          link.crossOrigin = ""
          document.head.appendChild(link)
        }

        // Load Leaflet JS
        if (!(window as any).L) {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          script.crossOrigin = ""

          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = () => reject(new Error("Failed to load Leaflet"))
            document.head.appendChild(script)
          })
        }

        setLeafletLoaded(true)
      } catch (error) {
        console.error("Failed to load Leaflet:", error)
        setMapError("Failed to load map library")
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return

    const L = (window as any).L
    if (!L) return

    try {
      // Initialize map
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(center, zoom)

      // Add OpenStreetMap base layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        opacity: 0.4,
        maxZoom: 19,
      }).addTo(map)

      // Add NASA layer
      const nasaLayer = L.tileLayer(getCurrentTileUrl(), {
        attribution: nasaLayers.find((l) => l.id === selectedLayer)?.attribution || "NASA GIBS",
        opacity: layerOpacity / 100,
        maxZoom: nasaLayers.find((l) => l.id === selectedLayer)?.maxZoom || 18,
      }).addTo(map)

      // Handle map clicks
      map.on("click", (e: any) => {
        if (onMapClick) {
          onMapClick(e.latlng.lat, e.latlng.lng)
        }
      })

      mapInstanceRef.current = map

      // Add initial data
      updateMapData()
    } catch (error) {
      console.error("Failed to initialize map:", error)
      setMapError("Failed to initialize map")
    }
  }, [leafletLoaded, center, zoom])

  // Update map data when props change
  useEffect(() => {
    if (mapInstanceRef.current && leafletLoaded) {
      updateMapData()
    }
  }, [buildings, roads, explosiveParams, showBuildings, showRoads, showBlastRadius, leafletLoaded])

  // Update NASA layer when settings change
  useEffect(() => {
    if (mapInstanceRef.current && leafletLoaded) {
      updateNASALayer()
    }
  }, [selectedLayer, selectedDate, layerOpacity, leafletLoaded])

  useEffect(() => {
    // Load NASA layers
    const layers = nasaAPI.getAvailableLayers()
    setNasaLayers(layers)

    // Load available dates for selected layer
    loadAvailableDates(selectedLayer)
  }, [selectedLayer])

  const loadAvailableDates = async (layerId: string) => {
    try {
      const dates = await nasaAPI.getAvailableDates(layerId)
      setAvailableDates(dates)
      if (dates.length > 0) {
        setSelectedDate(dates[0]) // Most recent date
      }
    } catch (error) {
      console.error("Failed to load available dates:", error)
      // Generate fallback dates
      const fallbackDates = []
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        fallbackDates.push(date.toISOString().split("T")[0])
      }
      setAvailableDates(fallbackDates)
    }
  }

  const getCurrentTileUrl = () => {
    try {
      const baseUrl = nasaAPI.getTileUrl(selectedLayer, 0, 0, 0, selectedDate)
      return baseUrl.replace("/0/0/0.", "/{z}/{y}/{x}.")
    } catch (error) {
      console.error("Failed to get tile URL:", error)
      return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    }
  }

  const updateNASALayer = () => {
    if (!mapInstanceRef.current || !leafletLoaded) return

    const L = (window as any).L
    const map = mapInstanceRef.current

    // Remove existing NASA layers
    map.eachLayer((layer: any) => {
      if (layer.options && layer.options.attribution && layer.options.attribution.includes("NASA")) {
        map.removeLayer(layer)
      }
    })

    // Add new NASA layer
    const nasaLayer = L.tileLayer(getCurrentTileUrl(), {
      attribution: nasaLayers.find((l) => l.id === selectedLayer)?.attribution || "NASA GIBS",
      opacity: layerOpacity / 100,
      maxZoom: nasaLayers.find((l) => l.id === selectedLayer)?.maxZoom || 18,
    })

    nasaLayer.addTo(map)
  }

  const updateMapData = () => {
    if (!mapInstanceRef.current || !leafletLoaded) return

    const L = (window as any).L
    const map = mapInstanceRef.current

    // Clear existing data layers
    map.eachLayer((layer: any) => {
      if (
        layer.options &&
        (layer.options.className === "building-layer" ||
          layer.options.className === "road-layer" ||
          layer.options.className === "blast-layer")
      ) {
        map.removeLayer(layer)
      }
    })

    // Add buildings
    if (showBuildings && buildings.length > 0) {
      buildings.forEach((building) => {
        if (building.coordinates.length < 3) return

        const positions: [number, number][] = building.coordinates.map((coord) => [coord[1], coord[0]])

        const polygon = L.polygon(positions, {
          color: getBuildingColor(building),
          fillColor: getBuildingColor(building),
          fillOpacity: 0.6,
          weight: 2,
          className: "building-layer",
        })

        polygon.bindPopup(`
          <div style="color: #000; font-family: system-ui;">
            <strong>Building</strong><br/>
            Type: ${building.tags.building || "Unknown"}<br/>
            Height: ${building.calculatedHeight.toFixed(1)}m
            ${building.tags.name ? `<br/>Name: ${building.tags.name}` : ""}
          </div>
        `)

        polygon.addTo(map)
      })
    }

    // Add roads
    if (showRoads && roads.length > 0) {
      roads.forEach((road) => {
        if (road.coordinates.length < 2) return

        const positions: [number, number][] = road.coordinates.map((coord) => [coord[1], coord[0]])

        const polyline = L.polyline(positions, {
          color: getRoadColor(road),
          weight: getRoadWidth(road),
          opacity: 0.8,
          className: "road-layer",
        })

        polyline.bindPopup(`
          <div style="color: #000; font-family: system-ui;">
            <strong>Road</strong><br/>
            Type: ${road.tags.highway}
            ${road.tags.name ? `<br/>Name: ${road.tags.name}` : ""}
          </div>
        `)

        polyline.addTo(map)
      })
    }

    // Add explosive location and blast radius
    if (explosiveParams) {
      // Explosion marker
      const marker = L.marker(explosiveParams.coordinates, {
        className: "blast-layer",
      })

      marker.bindPopup(`
        <div style="color: #000; font-family: system-ui;">
          <strong>Explosion Center</strong><br/>
          Type: ${explosiveParams.type}<br/>
          Mass: ${explosiveParams.mass}kg
        </div>
      `)

      marker.addTo(map)

      // Blast radius
      if (showBlastRadius) {
        const radius = calculateBlastRadius(explosiveParams.mass, explosiveParams.type)
        const circle = L.circle(explosiveParams.coordinates, {
          radius: radius,
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.2,
          weight: 2,
          dashArray: "5, 5",
          className: "blast-layer",
        })

        circle.bindPopup(`
          <div style="color: #000; font-family: system-ui;">
            <strong>Blast Radius</strong><br/>
            Radius: ${radius.toFixed(0)}m<br/>
            <em>Estimated damage zone</em>
          </div>
        `)

        circle.addTo(map)
      }
    }
  }

  const calculateBlastRadius = (mass: number, type: string): number => {
    // Simplified blast radius calculation (meters)
    const tntEquivalent = type === "TNT" ? mass : mass * 1.34 // C4 is ~1.34x more powerful
    return Math.pow(tntEquivalent / 1000, 1 / 3) * 100 // Cube root scaling
  }

  const getBuildingColor = (building: OSMBuilding): string => {
    const buildingType = building.tags.building || "yes"
    const colorMap: Record<string, string> = {
      residential: "#3b82f6", // Blue
      commercial: "#f59e0b", // Amber
      office: "#8b5cf6", // Purple
      industrial: "#ef4444", // Red
      hospital: "#10b981", // Green
      school: "#f97316", // Orange
      yes: "#6b7280", // Gray
    }
    return colorMap[buildingType] || "#6b7280"
  }

  const getRoadColor = (road: OSMRoad): string => {
    const roadType = road.tags.highway
    const colorMap: Record<string, string> = {
      motorway: "#dc2626", // Red
      trunk: "#ea580c", // Orange
      primary: "#d97706", // Amber
      secondary: "#ca8a04", // Yellow
      tertiary: "#65a30d", // Lime
      residential: "#6b7280", // Gray
    }
    return colorMap[roadType] || "#6b7280"
  }

  const getRoadWidth = (road: OSMRoad): number => {
    const roadType = road.tags.highway
    const widthMap: Record<string, number> = {
      motorway: 4,
      trunk: 3,
      primary: 3,
      secondary: 2,
      tertiary: 2,
      residential: 1,
    }
    return widthMap[roadType] || 1
  }

  const exportMap = async () => {
    console.log("Exporting map...")
    // Implementation would depend on chosen export method
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading NASA Satellite Map...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mapError) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <div className="text-red-400 mb-4">⚠️ Map Error</div>
            <p className="text-slate-400">{mapError}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-orange-600 hover:bg-orange-700">
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Satellite className="h-5 w-5 text-blue-500" />
            NASA Satellite Imagery
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              <Cloud className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={exportMap}
              className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layer Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Satellite Layer</label>
            <Select value={selectedLayer} onValueChange={setSelectedLayer}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {nasaLayers.map((layer) => (
                  <SelectItem key={layer.id} value={layer.id}>
                    {layer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Date</label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {availableDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Opacity: {layerOpacity}%</label>
            <Slider
              value={[layerOpacity]}
              onValueChange={(value) => setLayerOpacity(value[0])}
              max={100}
              step={10}
              className="w-full"
            />
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={showBuildings ? "default" : "outline"}
            onClick={() => setShowBuildings(!showBuildings)}
            className={
              showBuildings ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600 text-slate-300 hover:bg-slate-700"
            }
          >
            {showBuildings ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
            Buildings ({buildings.length})
          </Button>
          <Button
            size="sm"
            variant={showRoads ? "default" : "outline"}
            onClick={() => setShowRoads(!showRoads)}
            className={
              showRoads ? "bg-green-600 hover:bg-green-700" : "border-slate-600 text-slate-300 hover:bg-slate-700"
            }
          >
            {showRoads ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
            Roads ({roads.length})
          </Button>
          <Button
            size="sm"
            variant={showElevation ? "default" : "outline"}
            onClick={() => setShowElevation(!showElevation)}
            className={
              showElevation ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-slate-300 hover:bg-slate-700"
            }
          >
            {showElevation ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
            Elevation
          </Button>
        </div>

        {/* Map Container */}
        <div className="h-[500px] rounded-lg overflow-hidden border border-slate-600">
          <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
        </div>

        {/* Layer Information */}
        <div className="p-3 bg-slate-700/30 rounded-lg">
          <div className="text-sm text-slate-300">
            <strong className="text-white">
              {nasaLayers.find((l) => l.id === selectedLayer)?.name || "Selected Layer"}
            </strong>
            <br />
            {nasaLayers.find((l) => l.id === selectedLayer)?.description}
            <br />
            <span className="text-slate-400">
              Date: {new Date(selectedDate).toLocaleDateString()} | Resolution: Up to{" "}
              {nasaLayers.find((l) => l.id === selectedLayer)?.maxZoom || 18} zoom levels
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="text-slate-400">Buildings</div>
            <div className="text-white font-semibold">{buildings.length}</div>
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="text-slate-400">Roads</div>
            <div className="text-white font-semibold">{roads.length}</div>
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="text-slate-400">Layer</div>
            <div className="text-white font-semibold">{selectedLayer.split("_")[0]}</div>
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="text-slate-400">Opacity</div>
            <div className="text-white font-semibold">{layerOpacity}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
