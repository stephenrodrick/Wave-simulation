"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MapPin, Satellite, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { useRealTimeData } from "@/hooks/use-real-time-data"
import { LeafletMap } from "@/components/leaflet-map"

interface RealTimeMapProps {
  center: [number, number]
  zoom?: number
  onDataLoaded?: (data: any) => void
}

export function RealTimeMap({ center, zoom = 13, onDataLoaded }: RealTimeMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center)
  const [progress, setProgress] = useState(0)

  const { buildings, roads, elevation, loading, error, refetch } = useRealTimeData(mapCenter, 1)

  // Simulate progress for loading
  useEffect(() => {
    if (loading) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 200)

      return () => clearInterval(interval)
    } else {
      setProgress(100)
    }
  }, [loading])

  // Notify parent when data is loaded
  useEffect(() => {
    if (buildings.length > 0 || roads.length > 0 || elevation) {
      const data = {
        buildings,
        roads,
        elevation,
        metadata: {
          buildings_count: buildings.length,
          roads_count: roads.length,
          elevation_available: !!elevation,
          center: mapCenter,
        },
      }

      if (onDataLoaded) {
        onDataLoaded(data)
      }
    }
  }, [buildings, roads, elevation, onDataLoaded, mapCenter])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    console.log("Map clicked:", lat, lng)
    setMapCenter([lat, lng])
  }, [])

  const handleRefresh = useCallback(() => {
    setProgress(0)
    refetch()
  }, [refetch])

  return (
    <Card className="bg-slate-800/50 border-slate-700 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Real-Time Terrain Data
          </CardTitle>
          <div className="flex items-center gap-2">
            {loading ? (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Loading
              </Badge>
            ) : error ? (
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            ) : (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <Satellite className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Fetching terrain data...</span>
              <span className="text-slate-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-100px)]">
        {!loading && (buildings.length > 0 || roads.length > 0) ? (
          <LeafletMap
            center={mapCenter}
            zoom={zoom}
            buildings={buildings}
            roads={roads}
            elevation={elevation}
            onMapClick={handleMapClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-slate-900/50">
            <div className="text-center">
              {loading ? (
                <>
                  <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-400">Loading terrain data...</p>
                  <p className="text-slate-500 text-sm mt-1">Fetching buildings, roads, and elevation</p>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 mb-2">Failed to load terrain data</p>
                  <p className="text-slate-400 text-sm mb-4">{error}</p>
                  <Button size="sm" onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
                    Try Again
                  </Button>
                </>
              ) : (
                <>
                  <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">Click to load terrain data</p>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Data Summary */}
      {!loading && !error && (buildings.length > 0 || roads.length > 0) && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <div className="text-white font-semibold">{buildings.length}</div>
              <div className="text-slate-400">Buildings</div>
            </div>
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <div className="text-white font-semibold">{roads.length}</div>
              <div className="text-slate-400">Roads</div>
            </div>
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <div className="text-white font-semibold">{elevation ? "✓" : "✗"}</div>
              <div className="text-slate-400">Elevation</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
