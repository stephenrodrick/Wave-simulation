"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Square, Wifi, SkipBack, SkipForward, Settings } from "lucide-react"
import type { OSMBuilding, OSMRoad } from "@/lib/osm-api"
import type { DEMData } from "@/lib/elevation-api"

interface RealTimeSimulationViewerProps {
  simulationId: string
  buildings?: OSMBuilding[]
  roads?: OSMRoad[]
  elevation?: DEMData | null
  frames?: Array<{
    time: number
    pressure: number
    velocity: number
    temperature: number
  }>
  config?: {
    explosiveType: string
    explosiveMass: number
    coordinates: [number, number]
    location: string
  }
}

interface SimulationFrame {
  frame: number
  time: number
  pressureField: number[][]
  velocityField: Array<Array<{ x: number; y: number }>>
  maxPressure: number
  maxVelocity: number
}

export function RealTimeSimulationViewer({
  simulationId,
  buildings = [],
  roads = [],
  elevation = null,
  frames = [],
  config = {
    explosiveType: "TNT",
    explosiveMass: 1000,
    coordinates: [0, 0],
    location: "Unknown",
  },
}: RealTimeSimulationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames, setTotalFrames] = useState(Math.max(frames.length, 250))
  const [simulationData, setSimulationData] = useState<SimulationFrame | null>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSettings, setShowSettings] = useState(false)

  // Generate mock frame data based on input frames
  const generateFrameData = useCallback(
    (frameIndex: number): SimulationFrame => {
      const frame = frames[frameIndex] || { time: frameIndex * 0.1, pressure: 0, velocity: 0, temperature: 300 }
      const t = frame.time || frameIndex * 0.1

      // More realistic blast wave physics
      const maxPressure = frame.pressure * 15 || 15.0 * Math.exp(-t * 0.8) * Math.max(0, 1 - t * 0.3)
      const maxVelocity = frame.velocity * 350 || 350.0 * Math.exp(-t * 0.5) * Math.max(0, Math.sin(t * 1.5))

      // Generate pressure field with better physics
      const pressureField: number[][] = []
      for (let i = 0; i < 50; i++) {
        const row: number[] = []
        for (let j = 0; j < 50; j++) {
          const centerX = 25,
            centerY = 25
          const distance = Math.sqrt((i - centerX) ** 2 + (j - centerY) ** 2)
          const waveRadius = t * 8 // Wave propagation speed

          // Friedlander waveform approximation
          let pressure = 0
          if (distance <= waveRadius && waveRadius > 0) {
            const normalizedDistance = distance / waveRadius
            const timeAtDistance = normalizedDistance * t
            const tStarLocal = timeAtDistance / 2
            pressure = tStarLocal > 0 ? maxPressure * Math.exp(-tStarLocal) * (1 - tStarLocal) : 0
          }

          row.push(Math.max(0, pressure))
        }
        pressureField.push(row)
      }

      // Generate velocity field
      const velocityField: Array<Array<{ x: number; y: number }>> = []
      for (let i = 0; i < 25; i++) {
        const row: Array<{ x: number; y: number }> = []
        for (let j = 0; j < 25; j++) {
          const centerX = 12.5,
            centerY = 12.5
          const dx = i - centerX
          const dy = j - centerY
          const distance = Math.sqrt(dx ** 2 + dy ** 2)

          if (distance > 0) {
            const waveRadius = t * 8
            const magnitude =
              Math.abs(distance - waveRadius) < 3 ? maxVelocity * (1 - Math.abs(distance - waveRadius) / 3) : 0
            row.push({
              x: (magnitude * dx) / distance,
              y: (magnitude * dy) / distance,
            })
          } else {
            row.push({ x: 0, y: 0 })
          }
        }
        velocityField.push(row)
      }

      return {
        frame: frameIndex,
        time: t,
        pressureField,
        velocityField,
        maxPressure,
        maxVelocity,
      }
    },
    [frames],
  )

  // Animation loop
  const runAnimation = useCallback(() => {
    if (!isPlaying) return

    const nextFrame = (currentFrame + 1) % totalFrames
    const frameData = generateFrameData(nextFrame)

    setCurrentFrame(nextFrame)
    setSimulationData(frameData)
    renderFrame(frameData)

    const delay = 100 / playbackSpeed
    animationRef.current = setTimeout(() => {
      runAnimation()
    }, delay)
  }, [isPlaying, currentFrame, totalFrames, generateFrameData, playbackSpeed])

  // Enhanced rendering function
  const renderFrame = useCallback(
    (frameData: SimulationFrame) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#0f172a")
      gradient.addColorStop(1, "#1e293b")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Render terrain elevation
      if (elevation) {
        renderTerrain(ctx, elevation, canvas.width, canvas.height)
      }

      // Render buildings with enhanced styling
      if (buildings && buildings.length > 0) {
        renderBuildings(ctx, buildings, canvas.width, canvas.height)
      }

      // Render roads
      if (roads && roads.length > 0) {
        renderRoads(ctx, roads, canvas.width, canvas.height)
      }

      // Render blast wave
      renderBlastWave(ctx, frameData, config, canvas.width, canvas.height)

      // Render pressure field
      renderPressureField(ctx, frameData.pressureField, canvas.width, canvas.height)

      // Render velocity vectors
      renderVelocityField(ctx, frameData.velocityField, canvas.width, canvas.height)

      // Render explosion center
      renderExplosionCenter(ctx, config.coordinates, canvas.width, canvas.height, frameData.time)

      // Add frame info overlay
      renderFrameInfo(ctx, frameData, canvas.width, canvas.height)
    },
    [buildings, roads, elevation, config],
  )

  const renderTerrain = (ctx: CanvasRenderingContext2D, demData: DEMData, width: number, height: number) => {
    if (!demData || !demData.elevations || !demData.elevations.length) return

    const { elevations } = demData
    const maxElevation = Math.max(...elevations.flat())
    const minElevation = Math.min(...elevations.flat())
    const elevationRange = maxElevation - minElevation

    if (elevationRange === 0) return

    const cellWidth = width / demData.width
    const cellHeight = height / demData.height

    for (let i = 0; i < demData.height; i++) {
      for (let j = 0; j < demData.width; j++) {
        const elevation = elevations[i]?.[j] || 0
        const normalizedElevation = (elevation - minElevation) / elevationRange

        const intensity = Math.floor(normalizedElevation * 40 + 30)
        ctx.fillStyle = `rgba(${intensity + 20}, ${intensity + 15}, ${intensity + 10}, 0.3)`
        ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight)
      }
    }
  }

  const renderBuildings = (
    ctx: CanvasRenderingContext2D,
    buildingsData: OSMBuilding[],
    width: number,
    height: number,
  ) => {
    if (!buildingsData || !Array.isArray(buildingsData)) return

    buildingsData.forEach((building) => {
      if (!building || !building.coordinates || building.coordinates.length < 3) return

      const canvasCoords = building.coordinates.map((coord) => [
        ((coord[0] + 74.006) * width) / 0.02,
        height - ((coord[1] - 40.7128) * height) / 0.02,
      ])

      ctx.beginPath()
      canvasCoords.forEach((coord, index) => {
        if (index === 0) {
          ctx.moveTo(coord[0], coord[1])
        } else {
          ctx.lineTo(coord[0], coord[1])
        }
      })
      ctx.closePath()

      // Enhanced building styling
      const heightRatio = Math.min((building.calculatedHeight || 10) / 100, 1)
      const buildingType = building.tags?.building || "yes"

      let baseColor = [100, 100, 100]
      if (buildingType === "residential") baseColor = [120, 100, 80]
      else if (buildingType === "commercial") baseColor = [80, 100, 120]
      else if (buildingType === "industrial") baseColor = [100, 80, 80]

      const [r, g, b] = baseColor.map((c) => Math.floor(c + heightRatio * 80))

      // Add gradient effect
      const centerX = canvasCoords.reduce((sum, coord) => sum + coord[0], 0) / canvasCoords.length
      const centerY = canvasCoords.reduce((sum, coord) => sum + coord[1], 0) / canvasCoords.length

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50)
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`)
      gradient.addColorStop(1, `rgba(${r * 0.7}, ${g * 0.7}, ${b * 0.7}, 0.7)`)

      ctx.fillStyle = gradient
      ctx.fill()
      ctx.strokeStyle = "#64748b"
      ctx.lineWidth = 1
      ctx.stroke()
    })
  }

  const renderRoads = (ctx: CanvasRenderingContext2D, roadsData: OSMRoad[], width: number, height: number) => {
    if (!roadsData || !Array.isArray(roadsData)) return

    roadsData.forEach((road) => {
      if (!road || !road.coordinates || road.coordinates.length < 2) return

      const canvasCoords = road.coordinates.map((coord) => [
        ((coord[0] + 74.006) * width) / 0.02,
        height - ((coord[1] - 40.7128) * height) / 0.02,
      ])

      ctx.beginPath()
      canvasCoords.forEach((coord, index) => {
        if (index === 0) {
          ctx.moveTo(coord[0], coord[1])
        } else {
          ctx.lineTo(coord[0], coord[1])
        }
      })

      const roadType = road.tags?.highway || "residential"
      const styleMap: Record<string, { width: number; color: string }> = {
        motorway: { width: 4, color: "#fbbf24" },
        trunk: { width: 3, color: "#f59e0b" },
        primary: { width: 3, color: "#d97706" },
        secondary: { width: 2, color: "#92400e" },
        tertiary: { width: 2, color: "#78350f" },
        residential: { width: 1, color: "#451a03" },
      }

      const style = styleMap[roadType] || { width: 1, color: "#374151" }
      ctx.strokeStyle = style.color
      ctx.lineWidth = style.width
      ctx.stroke()
    })
  }

  const renderBlastWave = (
    ctx: CanvasRenderingContext2D,
    frameData: SimulationFrame,
    explosive: { coordinates: [number, number]; explosiveMass: number },
    width: number,
    height: number,
  ) => {
    const centerX = width / 2
    const centerY = height / 2

    const tntEquivalent = explosive.explosiveMass || 1000
    const scaledDistance = Math.pow(tntEquivalent / 1000, 1 / 3)
    const maxRadius = Math.min(width, height) * 0.4 * scaledDistance
    const currentRadius = (frameData.time / 10) * maxRadius

    // Multiple pressure rings
    for (let i = 0; i < 4; i++) {
      const waveRadius = currentRadius - i * 15
      if (waveRadius > 0) {
        const pressureRatio = frameData.maxPressure / 15.0
        const alpha = Math.max(0, pressureRatio * (1 - waveRadius / maxRadius) - i * 0.15)

        // Outer glow
        ctx.beginPath()
        ctx.arc(centerX, centerY, waveRadius + 5, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.3})`
        ctx.lineWidth = 8 - i
        ctx.stroke()

        // Main wave
        ctx.beginPath()
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.9})`
        ctx.lineWidth = 4 - i
        ctx.stroke()

        // Inner fill
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, waveRadius)
        gradient.addColorStop(0, `rgba(239, 68, 68, ${alpha * 0.2})`)
        gradient.addColorStop(0.7, `rgba(249, 115, 22, ${alpha * 0.1})`)
        gradient.addColorStop(1, `rgba(249, 115, 22, 0)`)
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }
  }

  const renderPressureField = (
    ctx: CanvasRenderingContext2D,
    pressureField: number[][],
    width: number,
    height: number,
  ) => {
    if (!pressureField || !pressureField.length) return

    const cellWidth = width / (pressureField[0]?.length || 1)
    const cellHeight = height / pressureField.length

    pressureField.forEach((row, i) => {
      if (!row) return
      row.forEach((pressure, j) => {
        if (pressure > 0.5) {
          const alpha = Math.min(pressure / 15.0, 1)
          const size = alpha * 8

          const x = j * cellWidth + cellWidth / 2
          const y = i * cellHeight + cellHeight / 2

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
          gradient.addColorStop(0, `rgba(34, 197, 94, ${alpha * 0.8})`)
          gradient.addColorStop(1, `rgba(34, 197, 94, ${alpha * 0.2})`)

          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        }
      })
    })
  }

  const renderVelocityField = (
    ctx: CanvasRenderingContext2D,
    velocityField: Array<Array<{ x: number; y: number }>>,
    width: number,
    height: number,
  ) => {
    if (!velocityField || !velocityField.length) return

    const cellWidth = width / (velocityField[0]?.length || 1)
    const cellHeight = height / velocityField.length

    ctx.strokeStyle = "#06b6d4"
    ctx.lineWidth = 1.5

    velocityField.forEach((row, i) => {
      if (!row) return
      row.forEach((velocity, j) => {
        if (!velocity) return
        const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
        if (magnitude > 20) {
          const x = j * cellWidth + cellWidth / 2
          const y = i * cellHeight + cellHeight / 2

          const scale = Math.min(magnitude / 150, 1) * 20
          const endX = x + (velocity.x / magnitude) * scale
          const endY = y - (velocity.y / magnitude) * scale

          // Velocity vector with gradient
          const gradient = ctx.createLinearGradient(x, y, endX, endY)
          gradient.addColorStop(0, `rgba(6, 182, 212, 0.8)`)
          gradient.addColorStop(1, `rgba(6, 182, 212, 0.4)`)
          ctx.strokeStyle = gradient

          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(endX, endY)
          ctx.stroke()

          // Arrow head
          const angle = Math.atan2(endY - y, endX - x)
          const arrowLength = 4
          ctx.beginPath()
          ctx.moveTo(endX, endY)
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6),
          )
          ctx.moveTo(endX, endY)
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6),
          )
          ctx.stroke()
        }
      })
    })
  }

  const renderExplosionCenter = (
    ctx: CanvasRenderingContext2D,
    coordinates: [number, number],
    width: number,
    height: number,
    time: number,
  ) => {
    const centerX = width / 2
    const centerY = height / 2

    const pulseIntensity = Math.sin(time * 3) * 0.3 + 0.7
    const glowIntensity = Math.sin(time * 5) * 0.2 + 0.8

    // Outer glow
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20 * glowIntensity)
    glowGradient.addColorStop(0, `rgba(239, 68, 68, ${glowIntensity * 0.6})`)
    glowGradient.addColorStop(1, `rgba(239, 68, 68, 0)`)
    ctx.beginPath()
    ctx.arc(centerX, centerY, 20 * glowIntensity, 0, Math.PI * 2)
    ctx.fillStyle = glowGradient
    ctx.fill()

    // Main explosion center
    ctx.beginPath()
    ctx.arc(centerX, centerY, 10 * pulseIntensity, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(239, 68, 68, ${pulseIntensity})`
    ctx.fill()

    // Inner core
    ctx.beginPath()
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2)
    ctx.fillStyle = "#ffffff"
    ctx.fill()
  }

  const renderFrameInfo = (
    ctx: CanvasRenderingContext2D,
    frameData: SimulationFrame,
    width: number,
    height: number,
  ) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 200, 80)

    ctx.fillStyle = "#ffffff"
    ctx.font = "12px monospace"
    ctx.fillText(`Frame: ${frameData.frame}/${totalFrames}`, 20, 30)
    ctx.fillText(`Time: ${frameData.time.toFixed(2)}s`, 20, 45)
    ctx.fillText(`Pressure: ${frameData.maxPressure.toFixed(1)} bar`, 20, 60)
    ctx.fillText(`Velocity: ${frameData.maxVelocity.toFixed(1)} m/s`, 20, 75)
  }

  // Initialize with first frame
  useEffect(() => {
    if (!simulationData) {
      const initialFrame = generateFrameData(0)
      setSimulationData(initialFrame)
      renderFrame(initialFrame)
    }
  }, [simulationData, generateFrameData, renderFrame])

  // Start animation when playing
  useEffect(() => {
    if (isPlaying) {
      runAnimation()
    }
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [isPlaying, runAnimation])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleStop = () => {
    setIsPlaying(false)
    setCurrentFrame(0)

    if (animationRef.current) {
      clearTimeout(animationRef.current)
    }

    const frameData = generateFrameData(0)
    setSimulationData(frameData)
    renderFrame(frameData)
  }

  const handleFrameSeek = (frame: number) => {
    setCurrentFrame(frame)
    const frameData = generateFrameData(frame)
    setSimulationData(frameData)
    renderFrame(frameData)
  }

  const progress = (currentFrame / (totalFrames - 1)) * 100

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            Real-Time Physics Simulation
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              <Wifi className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handlePlayPause} className="bg-orange-600 hover:bg-orange-700">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStop}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Settings Panel */}
          {showSettings && (
            <Card className="bg-slate-700/30 border-slate-600">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Playback Speed: {playbackSpeed}x
                    </label>
                    <Slider
                      value={[playbackSpeed]}
                      onValueChange={(value) => setPlaybackSpeed(value[0])}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <canvas
            ref={canvasRef}
            className="w-full h-[500px] rounded-lg border border-slate-600 cursor-crosshair"
            style={{ background: "#0f172a" }}
          />

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFrameSeek(Math.max(0, currentFrame - 10))}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <div className="flex-1">
                <Slider
                  value={[currentFrame]}
                  onValueChange={(value) => handleFrameSeek(value[0])}
                  max={totalFrames - 1}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFrameSeek(Math.min(totalFrames - 1, currentFrame + 10))}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <Progress value={progress} className="h-2" />
          </div>

          {/* Real-time stats */}
          {simulationData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="text-slate-400">Frame</div>
                <div className="text-white font-semibold">
                  {currentFrame + 1} / {totalFrames}
                </div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="text-slate-400">Time</div>
                <div className="text-white font-semibold">{simulationData.time.toFixed(2)}s</div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="text-slate-400">Max Pressure</div>
                <div className="text-white font-semibold">{simulationData.maxPressure.toFixed(1)} bar</div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="text-slate-400">Max Velocity</div>
                <div className="text-white font-semibold">{simulationData.maxVelocity.toFixed(1)} m/s</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
