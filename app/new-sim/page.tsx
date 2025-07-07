"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Settings, Loader2, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LocationSelector } from "@/components/location-selector"

interface SimulationConfig {
  name: string
  description: string
  explosiveType: string
  explosiveMass: number
  coordinates: [number, number]
  location: string
  dataSource: string
  pinnModel: string
}

export default function NewSimulationPage() {
  const router = useRouter()
  const [config, setConfig] = useState<SimulationConfig>({
    name: "",
    description: "",
    explosiveType: "TNT",
    explosiveMass: 500,
    coordinates: [40.7128, -74.006],
    location: "New York, NY",
    dataSource: "sample",
    pinnModel: "pretrained",
  })
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string
    coordinates: [number, number]
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("basic")

  const handleLocationSelect = (location: { name: string; coordinates: [number, number] }) => {
    setSelectedLocation(location)
    setConfig((prev) => ({
      ...prev,
      coordinates: location.coordinates,
      location: location.name,
    }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!config.name.trim()) {
      setError("Simulation name is required")
      return
    }

    if (config.explosiveMass <= 0) {
      setError("Explosive mass must be greater than 0")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create simulation")
      }

      if (data.success && data.simulation) {
        // Redirect to the new simulation page
        router.push(`/sim/${data.simulation.id}`)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Error creating simulation:", err)
      setError(err instanceof Error ? err.message : "Failed to create simulation")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = (tab: string) => {
    switch (tab) {
      case "basic":
        return config.name.trim() && config.explosiveType && config.explosiveMass > 0
      case "location":
        return config.coordinates.length === 2 && config.location
      case "advanced":
        return config.dataSource && config.pinnModel
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-white">ShockWave Sim AI</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Simulation</h1>
              <p className="text-slate-300">Configure your blast wave simulation parameters</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                <TabsTrigger value="basic" className="data-[state=active]:bg-orange-600">
                  Basic Settings
                </TabsTrigger>
                <TabsTrigger value="location" disabled={!canProceed("basic")}>
                  Location
                </TabsTrigger>
                <TabsTrigger value="advanced" disabled={!canProceed("location")}>
                  Advanced
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Basic Configuration
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Set up the fundamental parameters for your simulation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">
                        Simulation Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Urban Blast Analysis"
                        value={config.name}
                        onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-slate-300">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your simulation objectives..."
                        value={config.description}
                        onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="explosiveType" className="text-slate-300">
                          Explosive Type *
                        </Label>
                        <Select
                          value={config.explosiveType}
                          onValueChange={(value) => setConfig((prev) => ({ ...prev, explosiveType: value }))}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="TNT">TNT</SelectItem>
                            <SelectItem value="C4">C4</SelectItem>
                            <SelectItem value="PETN">PETN</SelectItem>
                            <SelectItem value="RDX">RDX</SelectItem>
                            <SelectItem value="ANFO">ANFO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="explosiveMass" className="text-slate-300">
                          Explosive Mass (kg) *
                        </Label>
                        <Input
                          id="explosiveMass"
                          type="number"
                          min="1"
                          max="10000"
                          value={config.explosiveMass}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, explosiveMass: Number.parseInt(e.target.value) || 0 }))
                          }
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentTab("location")}
                    disabled={!canProceed("basic")}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Next: Location
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-6">
                <LocationSelector onLocationSelect={handleLocationSelect} selectedLocation={selectedLocation} />

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentTab("basic")}
                    className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentTab("advanced")}
                    disabled={!canProceed("location")}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Next: Advanced
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Advanced Settings</CardTitle>
                    <CardDescription className="text-slate-400">
                      Configure data sources and AI model parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dataSource" className="text-slate-300">
                          Data Source
                        </Label>
                        <Select
                          value={config.dataSource}
                          onValueChange={(value) => setConfig((prev) => ({ ...prev, dataSource: value }))}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="sample">Sample Data</SelectItem>
                            <SelectItem value="osm">OpenStreetMap</SelectItem>
                            <SelectItem value="upload">Upload Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pinnModel" className="text-slate-300">
                          PINN Model
                        </Label>
                        <Select
                          value={config.pinnModel}
                          onValueChange={(value) => setConfig((prev) => ({ ...prev, pinnModel: value }))}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="pretrained">Pre-trained Model</SelectItem>
                            <SelectItem value="retrain">Retrain Model</SelectItem>
                            <SelectItem value="custom">Custom Architecture</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentTab("location")}
                    className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceed("advanced")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Simulation"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Simulation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400 text-sm">Name</Label>
                  <p className="text-white">{config.name || "Untitled Simulation"}</p>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm">Explosive</Label>
                  <p className="text-white">
                    {config.explosiveType} ({config.explosiveMass} kg)
                  </p>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm">Location</Label>
                  <p className="text-white">{config.location}</p>
                  <p className="text-slate-400 text-xs">
                    {config.coordinates[0].toFixed(4)}, {config.coordinates[1].toFixed(4)}
                  </p>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm">Data Source</Label>
                  <p className="text-white">{config.dataSource}</p>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm">PINN Model</Label>
                  <p className="text-white">{config.pinnModel}</p>
                </div>

                {config.description && (
                  <div>
                    <Label className="text-slate-400 text-sm">Description</Label>
                    <p className="text-white text-sm">{config.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
