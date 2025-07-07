"use client"

import { useEffect, useRef } from "react"

interface SimulationViewerProps {
  frame: number
  totalFrames: number
  coordinates: { lat: number; lng: number }
}

export function SimulationViewer({ frame, totalFrames, coordinates }: SimulationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 1
    const gridSize = 20
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw buildings (simplified rectangles)
    ctx.fillStyle = "#475569"
    const buildings = [
      { x: 100, y: 150, w: 80, h: 120 },
      { x: 220, y: 100, w: 60, h: 180 },
      { x: 320, y: 180, w: 100, h: 90 },
      { x: 450, y: 120, w: 70, h: 150 },
      { x: 150, y: 320, w: 90, h: 100 },
    ]

    buildings.forEach((building) => {
      ctx.fillRect(building.x, building.y, building.w, building.h)
      ctx.strokeStyle = "#64748b"
      ctx.strokeRect(building.x, building.y, building.w, building.h)
    })

    // Draw blast center
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Animate blast wave
    const progress = frame / totalFrames
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4
    const currentRadius = progress * maxRadius

    // Draw pressure waves (multiple rings)
    for (let i = 0; i < 3; i++) {
      const waveRadius = currentRadius - i * 30
      if (waveRadius > 0) {
        const alpha = Math.max(0, 1 - waveRadius / maxRadius - i * 0.2)

        // Pressure wave
        ctx.beginPath()
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.8})`
        ctx.lineWidth = 3
        ctx.stroke()

        // Fill with gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, waveRadius)
        gradient.addColorStop(0, `rgba(249, 115, 22, ${alpha * 0.1})`)
        gradient.addColorStop(1, `rgba(249, 115, 22, 0)`)
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    // Draw explosion center
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
    ctx.fillStyle = "#ef4444"
    ctx.fill()

    // Add pressure field visualization
    if (progress > 0.1) {
      const fieldSize = 10
      for (let x = fieldSize; x < canvas.width - fieldSize; x += fieldSize * 2) {
        for (let y = fieldSize; y < canvas.height - fieldSize; y += fieldSize * 2) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
          const waveDistance = Math.abs(distance - currentRadius)

          if (waveDistance < 50) {
            const intensity = Math.max(0, 1 - waveDistance / 50)
            const size = intensity * 4

            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(34, 197, 94, ${intensity * 0.6})`
            ctx.fill()
          }
        }
      }
    }
  }, [frame, totalFrames, coordinates])

  return <canvas ref={canvasRef} className="w-full h-full" style={{ background: "#0f172a" }} />
}
