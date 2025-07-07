"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, ArrowRight, Play, BarChart3, Globe, Shield, Cpu, Database } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-white">ShockWave Sim AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/new-sim">
              <Button className="bg-orange-600 hover:bg-orange-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30">
            Physics-Informed Neural Networks
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Advanced Blast Wave
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              {" "}
              Simulation
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Harness the power of AI-driven physics simulations to model blast wave propagation with unprecedented
            accuracy. Real-time analysis, interactive visualization, and comprehensive damage assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/new-sim">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-3">
                <Play className="h-5 w-5 mr-2" />
                Start Simulation
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800 text-lg px-8 py-3"
              >
                View Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Cutting-Edge Simulation Technology</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Our platform combines advanced physics modeling with AI to deliver accurate blast wave simulations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <Cpu className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle className="text-white">AI-Powered Physics</CardTitle>
              <CardDescription className="text-slate-400">
                Physics-Informed Neural Networks (PINNs) ensure accurate blast wave modeling with real-time computation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <Globe className="h-12 w-12 text-green-500 mb-4" />
              <CardTitle className="text-white">Real-World Data</CardTitle>
              <CardDescription className="text-slate-400">
                Integration with OpenStreetMap, NASA imagery, and elevation data for accurate environmental modeling
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-500 mb-4" />
              <CardTitle className="text-white">Advanced Analytics</CardTitle>
              <CardDescription className="text-slate-400">
                Comprehensive pressure, velocity, and damage analysis with interactive charts and 3D visualization
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <Shield className="h-12 w-12 text-red-500 mb-4" />
              <CardTitle className="text-white">Safety Assessment</CardTitle>
              <CardDescription className="text-slate-400">
                Detailed damage assessment for buildings, infrastructure, and casualty estimation for emergency planning
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <Database className="h-12 w-12 text-yellow-500 mb-4" />
              <CardTitle className="text-white">Data Export</CardTitle>
              <CardDescription className="text-slate-400">
                Export simulation results in multiple formats for further analysis and reporting
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <Zap className="h-12 w-12 text-orange-500 mb-4" />
              <CardTitle className="text-white">Real-Time Processing</CardTitle>
              <CardDescription className="text-slate-400">
                Live simulation updates with WebSocket connectivity for real-time monitoring and control
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/30">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Simulation?</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join researchers, engineers, and safety professionals using ShockWave Sim AI for advanced blast analysis
            </p>
            <Link href="/new-sim">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-3">
                <Play className="h-5 w-5 mr-2" />
                Create Your First Simulation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/80">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Zap className="h-6 w-6 text-orange-500" />
              <span className="text-lg font-bold text-white">ShockWave Sim AI</span>
            </div>
            <div className="text-slate-400 text-sm">© 2024 ShockWave Sim AI. Advanced physics simulation platform.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
