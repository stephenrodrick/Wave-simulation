"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ImpulseChartProps {
  data: Array<{
    time: number
    pressure: number
    velocity?: number
    temperature?: number
  }>
  currentFrame?: number
}

export function ImpulseChart({ data, currentFrame = 0 }: ImpulseChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const width = canvas.width
    const height = canvas.height
    const padding = 40

    // Clear canvas
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, width, height)

    // Calculate impulse (integral of pressure over time)
    const impulseData = data.map((point, index) => {
      let impulse = 0
      for (let i = 0; i <= index; i++) {
        if (i > 0) {
          const dt = data[i].time - data[i - 1].time
          impulse += data[i].pressure * dt
        }
      }
      return {
        time: point.time,
        impulse: impulse,
        velocity: point.velocity || 0,
      }
    })

    // Find data ranges
    const maxTime = Math.max(...impulseData.map((d) => d.time))
    const maxImpulse = Math.max(...impulseData.map((d) => Math.abs(d.impulse)))
    const maxVelocity = Math.max(...impulseData.map((d) => Math.abs(d.velocity)))

    // Helper functions
    const xScale = (time: number) => padding + (time / maxTime) * (width - 2 * padding)
    const yScale = (value: number, max: number) => height - padding - (value / max) * (height - 2 * padding)

    // Draw grid
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (i / 10) * (height - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = "#9ca3af"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()

    // Draw impulse curve
    if (impulseData.length > 1) {
      ctx.strokeStyle = "#10b981"
      ctx.lineWidth = 2
      ctx.beginPath()

      impulseData.forEach((point, index) => {
        const x = xScale(point.time)
        const y = yScale(point.impulse, maxImpulse)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw velocity curve (scaled)
      ctx.strokeStyle = "#8b5cf6"
      ctx.lineWidth = 2
      ctx.beginPath()

      impulseData.forEach((point, index) => {
        const x = xScale(point.time)
        const y = yScale(point.velocity, maxVelocity)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw data points for impulse
      ctx.fillStyle = "#10b981"
      impulseData.forEach((point) => {
        const x = xScale(point.time)
        const y = yScale(point.impulse, maxImpulse)
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw data points for velocity
      ctx.fillStyle = "#8b5cf6"
      impulseData.forEach((point) => {
        const x = xScale(point.time)
        const y = yScale(point.velocity, maxVelocity)
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Highlight current frame
    if (currentFrame < impulseData.length) {
      const currentPoint = impulseData[currentFrame]
      if (currentPoint) {
        const x = xScale(currentPoint.time)

        // Draw vertical line
        ctx.strokeStyle = "#ef4444"
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, height - padding)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw current points
        const impulseY = yScale(currentPoint.impulse, maxImpulse)
        const velocityY = yScale(currentPoint.velocity, maxVelocity)

        ctx.fillStyle = "#ef4444"
        ctx.beginPath()
        ctx.arc(x, impulseY, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, velocityY, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw labels
    ctx.fillStyle = "#d1d5db"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"

    // X-axis labels
    for (let i = 0; i <= 5; i++) {
      const time = (i / 5) * maxTime
      const x = xScale(time)
      ctx.fillText(time.toFixed(1) + "s", x, height - 10)
    }

    // Y-axis labels (impulse)
    ctx.textAlign = "right"
    ctx.fillStyle = "#10b981"
    for (let i = 0; i <= 5; i++) {
      const impulse = (i / 5) * maxImpulse
      const y = height - padding - (i / 5) * (height - 2 * padding)
      ctx.fillText(impulse.toFixed(2), padding - 10, y + 4)
    }

    // Legend
    ctx.textAlign = "left"
    ctx.font = "12px sans-serif"
    ctx.fillStyle = "#10b981"
    ctx.fillText("● Impulse", width - 150, 30)
    ctx.fillStyle = "#8b5cf6"
    ctx.fillText("● Velocity", width - 150, 50)

    // Title and axis labels
    ctx.textAlign = "center"
    ctx.font = "14px sans-serif"
    ctx.fillStyle = "#ffffff"
    ctx.fillText("Impulse & Velocity vs Time", width / 2, 20)

    ctx.font = "12px sans-serif"
    ctx.fillStyle = "#d1d5db"
    ctx.fillText("Time (seconds)", width / 2, height - 5)

    // Y-axis label (rotated)
    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText("Impulse (bar·s) / Velocity (m/s)", 0, 0)
    ctx.restore()
  }, [data, currentFrame])

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Impulse Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} className="w-full h-[300px]" />
        {data.length === 0 && (
          <div className="flex items-center justify-center h-[300px] text-slate-400">No impulse data available</div>
        )}
      </CardContent>
    </Card>
  )
}
