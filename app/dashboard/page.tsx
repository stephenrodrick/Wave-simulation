"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Zap,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Eye,
  Download,
  Clock,
  MapPin,
  TrendingUp,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface Simulation {
  id: string
  name: string
  description: string
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  created_at: string
  updated_at: string
  config: {
    explosiveType: string
    explosiveMass: number
    coordinates: [number, number]
    location: string
  }
}

export default function DashboardPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchSimulations()
  }, [])

  const fetchSimulations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/simulations")
      const data = await response.json()

      if (data.success && data.simulations) {
        setSimulations(data.simulations)
      } else {
        throw new Error("Failed to fetch simulations")
      }
    } catch (err) {
      console.error("Error fetching simulations:", err)
      setError("Failed to load simulations")

      // Use mock data as fallback
      const mockSimulations: Simulation[] = [
        {
          id: "sim_1751895428368",
          name: "Urban Blast Analysis - NYC",
          description: "High-resolution blast wave simulation in urban environment",
          status: "completed",
          progress: 100,
          created_at: "2024-01-07T10:30:00Z",
          updated_at: "2024-01-07T11:45:00Z",
          config: {
            explosiveType: "TNT",
            explosiveMass: 500,
            coordinates: [40.7128, -74.006],
            location: "New York, NY",
          },
        },
        {
          id: "sim_1751896147629",
          name: "Industrial Zone Analysis - LA",
          description: "Blast simulation in industrial complex",
          status: "running",
          progress: 65,
          created_at: "2024-01-07T09:15:00Z",
          updated_at: "2024-01-07T11:30:00Z",
          config: {
            explosiveType: "C4",
            explosiveMass: 750,
            coordinates: [34.0522, -118.2437],
            location: "Los Angeles, CA",
          },
        },
        {
          id: "sim_1751896200000",
          name: "Coastal Defense Simulation",
          description: "Maritime blast wave analysis",
          status: "pending",
          progress: 0,
          created_at: "2024-01-07T08:00:00Z",
          updated_at: "2024-01-07T08:00:00Z",
          config: {
            explosiveType: "RDX",
            explosiveMass: 300,
            coordinates: [37.7749, -122.4194],
            location: "San Francisco, CA",
          },
        },
      ]
      setSimulations(mockSimulations)
    } finally {
      setLoading(false)
    }
  }

  const filteredSimulations = simulations.filter((sim) => {
    const matchesSearch =
      sim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || sim.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "running":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="h-3 w-3" />
      case "completed":
        return <TrendingUp className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      default:
        return <Pause className="h-3 w-3" />
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
            <Link href="/new-sim">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                New Simulation
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Simulation Dashboard</h1>
          <p className="text-slate-300">Manage and monitor your blast wave simulations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Simulations</p>
                  <p className="text-2xl font-bold text-white">{simulations.length}</p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Running</p>
                  <p className="text-2xl font-bold text-blue-300">
                    {simulations.filter((s) => s.status === "running").length}
                  </p>
                </div>
                <Play className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-green-300">
                    {simulations.filter((s) => s.status === "completed").length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-300">
                    {simulations.filter((s) => s.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search simulations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simulations List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-slate-400">Loading simulations...</p>
            </div>
          </div>
        ) : filteredSimulations.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Zap className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No simulations found</h3>
              <p className="text-slate-400 text-center mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first blast wave simulation"}
              </p>
              <Link href="/new-sim">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Simulation
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSimulations.map((simulation) => (
              <Card
                key={simulation.id}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">{simulation.name}</CardTitle>
                      <CardDescription className="text-slate-400 text-sm">{simulation.description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(simulation.status)}>
                      {getStatusIcon(simulation.status)}
                      <span className="ml-1">{simulation.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar for Running Simulations */}
                    {simulation.status === "running" && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-slate-300">{simulation.progress}%</span>
                        </div>
                        <Progress value={simulation.progress} className="h-2" />
                      </div>
                    )}

                    {/* Simulation Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Explosive</p>
                        <p className="text-white font-medium">
                          {simulation.config.explosiveType} {simulation.config.explosiveMass}kg
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Location</p>
                        <p className="text-white font-medium flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {simulation.config.location}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-slate-400">Created</p>
                      <p className="text-slate-300">{new Date(simulation.created_at).toLocaleDateString()}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/sim/${simulation.id}`} className="flex-1">
                        <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
