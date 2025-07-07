"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, BookOpen, Code, Cpu, Globe, BarChart3, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DocsPage() {
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
            <Link href="/new-sim" className="text-slate-300 hover:text-white transition-colors">
              New Simulation
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Documentation</h1>
              <p className="text-slate-300">Learn how to use ShockWave Sim AI for advanced blast wave simulation</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="physics">Physics Model</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Platform Overview
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Understanding ShockWave Sim AI's capabilities and architecture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  ShockWave Sim AI is an advanced blast wave simulation platform that combines Physics-Informed Neural
                  Networks (PINNs) with real-world data to provide accurate and efficient blast analysis. Our platform
                  is designed for researchers, engineers, and safety professionals who need reliable blast wave
                  modeling.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      AI-Powered Physics
                    </h4>
                    <p className="text-slate-400 text-sm">
                      Our PINN models solve complex partial differential equations in real-time, providing accurate
                      blast wave propagation without traditional computational overhead.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      Real-World Integration
                    </h4>
                    <p className="text-slate-400 text-sm">
                      Seamless integration with OpenStreetMap, NASA satellite imagery, and elevation data for accurate
                      environmental modeling and terrain analysis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <BarChart3 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <h4 className="text-white font-semibold">Advanced Analytics</h4>
                    <p className="text-slate-400 text-sm">Pressure, velocity, and damage analysis</p>
                  </div>
                  <div className="text-center p-4">
                    <Zap className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <h4 className="text-white font-semibold">Real-Time Processing</h4>
                    <p className="text-slate-400 text-sm">Live simulation updates and monitoring</p>
                  </div>
                  <div className="text-center p-4">
                    <Code className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="text-white font-semibold">API Access</h4>
                    <p className="text-slate-400 text-sm">Programmatic access to all features</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="getting-started" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Start Guide</CardTitle>
                <CardDescription className="text-slate-400">
                  Get up and running with your first simulation in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 min-w-8 h-8 flex items-center justify-center">
                      1
                    </Badge>
                    <div>
                      <h4 className="text-white font-semibold">Create a New Simulation</h4>
                      <p className="text-slate-400">
                        Navigate to the dashboard and click "New Simulation" to start the configuration wizard.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 min-w-8 h-8 flex items-center justify-center">
                      2
                    </Badge>
                    <div>
                      <h4 className="text-white font-semibold">Configure Parameters</h4>
                      <p className="text-slate-400">
                        Set your explosive type, mass, and location. Choose from TNT, C4, PETN, RDX, or ANFO explosives.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 min-w-8 h-8 flex items-center justify-center">
                      3
                    </Badge>
                    <div>
                      <h4 className="text-white font-semibold">Select Location</h4>
                      <p className="text-slate-400">
                        Choose your simulation location using our interactive map, search functionality, or manual
                        coordinates.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 min-w-8 h-8 flex items-center justify-center">
                      4
                    </Badge>
                    <div>
                      <h4 className="text-white font-semibold">Run Simulation</h4>
                      <p className="text-slate-400">
                        Launch your simulation and monitor progress in real-time with our advanced visualization tools.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="text-blue-300 font-semibold mb-2">💡 Pro Tip</h4>
                  <p className="text-blue-200 text-sm">
                    Start with a smaller explosive mass (100-500kg) for faster initial results, then scale up for more
                    detailed analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="physics" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Physics Model</CardTitle>
                <CardDescription className="text-slate-400">
                  Understanding the underlying physics and mathematical models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Euler Equations</h4>
                    <p className="text-slate-300 mb-2">
                      Our PINN models solve the 2D compressible Euler equations for blast wave propagation:
                    </p>
                    <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-sm text-slate-300">
                      ∂ρ/∂t + ∇·(ρv) = 0<br />
                      ∂(ρv)/∂t + ∇·(ρv⊗v) + ∇p = 0<br />
                      ∂E/∂t + ∇·((E+p)v) = 0
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Friedlander Waveform</h4>
                    <p className="text-slate-300">
                      Initial blast conditions are modeled using the Friedlander waveform for realistic pressure
                      profiles:
                    </p>
                    <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-sm text-slate-300">
                      p(t) = p₀(1 - t/t₊)e^(-αt/t₊)
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Scaling Laws</h4>
                    <p className="text-slate-300">
                      Blast parameters are scaled using cube-root scaling for TNT equivalence:
                    </p>
                    <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-sm text-slate-300">
                      R = R₀(W/W₀)^(1/3)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">API Reference</CardTitle>
                <CardDescription className="text-slate-400">
                  Programmatic access to simulation functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Create Simulation</h4>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <code className="text-green-400">POST /api/simulations</code>
                      <pre className="text-slate-300 text-sm mt-2">{`{
  "name": "Urban Blast Analysis",
  "explosiveType": "TNT",
  "explosiveMass": 500,
  "coordinates": [40.7128, -74.006],
  "location": "New York, NY"
}`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Get Simulation</h4>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <code className="text-blue-400">GET /api/simulations/{"{id}"}</code>
                      <p className="text-slate-400 text-sm mt-2">Retrieve simulation details and current status</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Export Results</h4>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <code className="text-purple-400">GET /api/simulations/{"{id}"}/export?format=csv</code>
                      <p className="text-slate-400 text-sm mt-2">Export simulation data in CSV or JSON format</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Example Simulations</CardTitle>
                <CardDescription className="text-slate-400">
                  Common use cases and configuration examples
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Urban Environment</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Modeling blast effects in dense urban areas with buildings and infrastructure.
                    </p>
                    <div className="text-xs text-slate-500">
                      • TNT: 500-1000kg
                      <br />• High building density
                      <br />• Detailed damage assessment
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Industrial Facility</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Analyzing blast propagation in industrial complexes with specialized structures.
                    </p>
                    <div className="text-xs text-slate-500">
                      • C4: 750-2000kg
                      <br />• Industrial buildings
                      <br />• Safety zone analysis
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Open Terrain</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Studying blast waves in open areas with minimal obstructions.
                    </p>
                    <div className="text-xs text-slate-500">
                      • Various explosives
                      <br />• Terrain elevation effects
                      <br />• Maximum range analysis
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Coastal Defense</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Maritime blast scenarios with water-air interface considerations.
                    </p>
                    <div className="text-xs text-slate-500">
                      • RDX: 300-800kg
                      <br />• Water surface effects
                      <br />• Coastal infrastructure
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
