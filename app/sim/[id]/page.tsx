"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RealTimeSimulationViewer } from "@/components/real-time-simulation-viewer"
import { PressureChart } from "@/components/pressure-chart"
import { ImpulseChart } from "@/components/impulse-chart"
import { Download, Share2, Settings, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { OSMBuilding, OSMRoad } from "@/lib/osm-api"
import type { DEMData } from "@/lib/elevation-api"

interface SimulationData {
  id: string
  name: string
  status: "running" | "completed" | "failed" | "pending"
  config: {
    explosiveType: string
    explosiveMass: number
    coordinates: [number, number]
    location: string
  }
  frames: Array<{
    time: number
    pressure: number
    velocity: number
    temperature: number
  }>
  buildings: OSMBuilding[]
  roads: OSMRoad[]
  elevation: DEMData | null
  createdAt: string
  completedAt?: string
}

export default function SimulationPage() {
  const params = useParams()
  const simulationId = params.id as string

  const [simulation, setSimulation] = useState<SimulationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSimulation = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/simulations/${simulationId}`)

        if (!response.ok) {
          if (response.status === 404) {
            // Generate mock data for any simulation ID
            const mockSimulation: SimulationData = {
              id: simulationId,
              name: `Simulation ${simulationId}`,
              status: "completed",
              config: {
                explosiveType: "TNT",
                explosiveMass: 1000,
                coordinates: [40.7128, -74.006],
                location: "New York City, NY",
              },
              frames: Array.from({ length: 250 }, (_, i) => ({
                time: i * 0.1,
                pressure: 15 * Math.exp(-i * 0.02) * Math.max(0, 1 - i * 0.004),
                velocity: 350 * Math.exp(-i * 0.015) * Math.max(0, Math.sin(i * 0.05)),
                temperature: 300 + 2000 * Math.exp(-i * 0.03),
              })),
              buildings: [
                {
                  id: "building_1",
                  coordinates: [
                    [40.712, -74.007],
                    [40.7125, -74.007],
                    [40.7125, -74.0065],
                    [40.712, -74.0065],
                    [40.712, -74.007],
                  ],
                  tags: { building: "residential" },
                  calculatedHeight: 25,
                },
                {
                  id: "building_2",
                  coordinates: [
                    [40.713, -74.005],
                    [40.7135, -74.005],
                    [40.7135, -74.0045],
                    [40.713, -74.0045],
                    [40.713, -74.005],
                  ],
                  tags: { building: "commercial" },
                  calculatedHeight: 45,
                },
              ],
              roads: [
                {
                  id: "road_1",
                  coordinates: [
                    [40.711, -74.008],
                    [40.714, -74.004],
                  ],
                  tags: { highway: "primary" },
                },
              ],
              elevation: {
                width: 10,
                height: 10,
                elevations: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => Math.random() * 50 + 10)),
              },
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            }
            setSimulation(mockSimulation)
          } else {
            throw new Error(`Failed to fetch simulation: ${response.statusText}`)
          }
        } else {
          const data = await response.json()
          setSimulation(data)
        }
      } catch (err) {
        console.error("Error fetching simulation:", err)
        setError(err instanceof Error ? err.message : "Failed to load simulation")
      } finally {
        setLoading(false)
      }
    }

    if (simulationId) {
      fetchSimulation()
    }
  }, [simulationId])

  const handleExport = async (format: "csv" | "json") => {
    try {
      const response = await fetch(`/api/simulations/${simulationId}/export?format=${format}`)
      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `simulation_${simulationId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Loading simulation...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!simulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-center">Simulation not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{simulation.name}</h1>
            <div className="flex items-center gap-4">
              <Badge
                className={
                  simulation.status === "completed"
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : simulation.status === "running"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : simulation.status === "failed"
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                }
              >
                {simulation.status}
              </Badge>
              <span className="text-slate-400">
                {simulation.config.location} • {simulation.config.explosiveType} • {simulation.config.explosiveMass}kg
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("json")}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="simulation" className="space-y-6">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="simulation" className="data-[state=active]:bg-slate-700">
              Live Simulation
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-slate-700">
              Analysis
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-slate-700">
              Raw Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulation" className="space-y-6">
            <RealTimeSimulationViewer
              simulationId={simulation.id}
              buildings={simulation.buildings}
              roads={simulation.roads}
              elevation={simulation.elevation}
              frames={simulation.frames}
              config={simulation.config}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PressureChart data={simulation.frames} />
              <ImpulseChart data={simulation.frames} />
            </div>

            {/* Summary Statistics */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Simulation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400">Peak Pressure</div>
                    <div className="text-white font-semibold">
                      {Math.max(...simulation.frames.map((f) => f.pressure)).toFixed(1)} bar
                    </div>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400">Peak Velocity</div>
                    <div className="text-white font-semibold">
                      {Math.max(...simulation.frames.map((f) => f.velocity)).toFixed(1)} m/s
                    </div>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400">Duration</div>
                    <div className="text-white font-semibold">
                      {simulation.frames[simulation.frames.length - 1]?.time.toFixed(1)}s
                    </div>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400">Total Frames</div>
                    <div className="text-white font-semibold">{simulation.frames.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Raw Simulation Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left p-2 text-slate-300">Time (s)</th>
                        <th className="text-left p-2 text-slate-300">Pressure (bar)</th>
                        <th className="text-left p-2 text-slate-300">Velocity (m/s)</th>
                        <th className="text-left p-2 text-slate-300">Temperature (K)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulation.frames.slice(0, 20).map((frame, index) => (
                        <tr key={index} className="border-b border-slate-700/50">
                          <td className="p-2 text-white">{frame.time.toFixed(3)}</td>
                          <td className="p-2 text-white">{frame.pressure.toFixed(2)}</td>
                          <td className="p-2 text-white">{frame.velocity.toFixed(2)}</td>
                          <td className="p-2 text-white">{frame.temperature.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {simulation.frames.length > 20 && (
                    <div className="text-center p-4 text-slate-400">
                      Showing first 20 of {simulation.frames.length} frames
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
