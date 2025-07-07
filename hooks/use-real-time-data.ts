"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { OSMBuilding, OSMRoad } from "@/lib/osm-api"
import type { DEMData } from "@/lib/elevation-api"
import { OSMDataFetcher } from "@/lib/osm-api"
import { ElevationDataFetcher } from "@/lib/elevation-api"
import { createBoundingBox } from "@/lib/bounding-box"

interface UseRealTimeDataProps {
  bbox?: [number, number, number, number] // [lat1, lng1, lat2, lng2]
  enabled?: boolean
  refreshInterval?: number
}

interface UseRealTimeDataReturn {
  buildings: OSMBuilding[]
  roads: OSMRoad[]
  elevation: DEMData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useRealTimeData(
  centerOrProps: [number, number] | UseRealTimeDataProps,
  radiusKm = 1,
): UseRealTimeDataReturn {
  const [buildings, setBuildings] = useState<OSMBuilding[]>([])
  const [roads, setRoads] = useState<OSMRoad[]>([])
  const [elevation, setElevation] = useState<DEMData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchingRef = useRef(false)
  const lastBboxRef = useRef<string>("")

  // Handle both function signatures
  const isPropsObject = !Array.isArray(centerOrProps)
  const center = isPropsObject ? ([40.7128, -74.006] as [number, number]) : centerOrProps
  const bbox = isPropsObject
    ? (centerOrProps as UseRealTimeDataProps).bbox
    : createBoundingBox(center[0], center[1], radiusKm)
  const enabled = isPropsObject ? ((centerOrProps as UseRealTimeDataProps).enabled ?? true) : true

  const osmFetcher = new OSMDataFetcher()
  const elevationFetcher = new ElevationDataFetcher()

  const fetchData = useCallback(async () => {
    if (!bbox || !enabled || fetchingRef.current) {
      return
    }

    const bboxString = Array.isArray(bbox) ? bbox.join(",") : `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`
    if (bboxString === lastBboxRef.current) {
      return // Same bbox, no need to refetch
    }

    try {
      fetchingRef.current = true
      setLoading(true)
      setError(null)

      console.log("Fetching real-time data for bbox:", bboxString)

      // Check if backend API is available first
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      let useBackendAPI = false

      try {
        const healthResponse = await fetch(`${apiUrl}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        })
        useBackendAPI = healthResponse.ok
        console.log("Backend API available:", useBackendAPI)
      } catch (e) {
        console.warn("Backend API not available, using direct API calls")
        useBackendAPI = false
      }

      if (useBackendAPI) {
        // Use backend API
        const response = await fetch(`${apiUrl}/api/real-time-urban-data?bbox=${bboxString}`)

        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status}`)
        }

        const result = await response.json()

        setBuildings(
          result.buildings?.map((b: any) => ({
            id: b.id,
            type: "way",
            coordinates: b.coordinates,
            tags: b.tags,
            calculatedHeight: b.height,
          })) || [],
        )

        setRoads(
          result.roads?.map((r: any) => ({
            id: r.id,
            coordinates: r.coordinates,
            tags: r.tags,
          })) || [],
        )

        setElevation(
          result.elevation?.data?.length > 0
            ? {
                width: result.elevation.width,
                height: result.elevation.height,
                bounds: Array.isArray(bbox)
                  ? {
                      south: bbox[0],
                      west: bbox[1],
                      north: bbox[2],
                      east: bbox[3],
                    }
                  : bbox,
                elevations: result.elevation.data,
                resolution: result.elevation.resolution,
              }
            : null,
        )
      } else {
        // Use direct API calls
        console.log("Using direct API calls for real-time data")

        const bboxObj = Array.isArray(bbox)
          ? {
              south: bbox[0],
              west: bbox[1],
              north: bbox[2],
              east: bbox[3],
            }
          : bbox

        // Fetch buildings and roads in parallel
        const [buildingsData, roadsData] = await Promise.all([
          osmFetcher.fetchBuildings(bboxObj).catch((error) => {
            console.warn("Buildings fetch failed:", error)
            return []
          }),
          osmFetcher.fetchRoads(bboxObj).catch((error) => {
            console.warn("Roads fetch failed:", error)
            return []
          }),
        ])

        // Fetch elevation data
        const elevationData = await elevationFetcher.fetchElevationGrid(bboxObj).catch((error) => {
          console.warn("Elevation fetch failed:", error)
          return null
        })

        setBuildings(buildingsData)
        setRoads(roadsData)
        setElevation(elevationData)
      }

      lastBboxRef.current = bboxString
      console.log("Real-time data fetch completed successfully")
    } catch (err) {
      console.error("Error fetching real-time data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")

      // Set mock data as fallback
      const mockBuildings: OSMBuilding[] = [
        {
          id: "mock-building-1",
          type: "way",
          coordinates: [
            [-74.01, 40.71],
            [-74.009, 40.71],
            [-74.009, 40.711],
            [-74.01, 40.711],
            [-74.01, 40.71],
          ],
          calculatedHeight: 50,
          tags: { building: "residential" },
        },
        {
          id: "mock-building-2",
          type: "way",
          coordinates: [
            [-74.008, 40.712],
            [-74.007, 40.712],
            [-74.007, 40.713],
            [-74.008, 40.713],
            [-74.008, 40.712],
          ],
          calculatedHeight: 80,
          tags: { building: "commercial" },
        },
      ]

      const mockRoads: OSMRoad[] = [
        {
          id: "mock-road-1",
          coordinates: [
            [-74.015, 40.71],
            [-74.005, 40.71],
          ],
          tags: { highway: "primary" },
        },
        {
          id: "mock-road-2",
          coordinates: [
            [-74.01, 40.708],
            [-74.01, 40.715],
          ],
          tags: { highway: "secondary" },
        },
      ]

      const mockElevation: DEMData = {
        width: 10,
        height: 10,
        bounds: Array.isArray(bbox)
          ? {
              south: bbox[0],
              west: bbox[1],
              north: bbox[2],
              east: bbox[3],
            }
          : bbox,
        elevations: Array(10)
          .fill(0)
          .map(() =>
            Array(10)
              .fill(0)
              .map(() => Math.random() * 20),
          ),
        resolution: 0.002,
      }

      setBuildings(mockBuildings)
      setRoads(mockRoads)
      setElevation(mockElevation)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [bbox, enabled])

  const refetch = useCallback(() => {
    lastBboxRef.current = "" // Force refetch
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (enabled && bbox) {
      fetchData()
    }
  }, [fetchData, enabled, bbox])

  return {
    buildings: buildings || [],
    roads: roads || [],
    elevation,
    loading,
    error,
    refetch,
  }
}
