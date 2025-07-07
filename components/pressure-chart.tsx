"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PressureChartProps {
  data: Array<{
    time: number
    pressure: number
    velocity?: number
    temperature?: number
  }>
  currentFrame?: number
}

export function PressureChart({ data, currentFrame = 0 }: PressureChartProps) {
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

    // Find data ranges
    const maxTime = Math.max(...data.map((d) => d.time))
    const maxPressure = Math.max(...data.map((d) => Math.abs(d.pressure)))
    const minPressure = Math.min(...data.map((d) => d.pressure))

    // Helper functions
    const xScale = (time: number) => padding + (time / maxTime) * (width - 2 * padding)
    const yScale = (pressure: number) =>
      height - padding - ((pressure - minPressure) / (maxPressure - minPressure)) * (height - 2 * padding)

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

    // Draw pressure curve
    if (data.length > 1) {
      ctx.strokeStyle = "#f59e0b"
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((point, index) => {
        const x = xScale(point.time)
        const y = yScale(point.pressure)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw data points
      ctx.fillStyle = "#f59e0b"
      data.forEach((point) => {
        const x = xScale(point.time)
        const y = yScale(point.pressure)
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Highlight current frame
    if (currentFrame < data.length) {
      const currentPoint = data[currentFrame]
      if (currentPoint) {
        const x = xScale(currentPoint.time)
        const y = yScale(currentPoint.pressure)

        // Draw vertical line
        ctx.strokeStyle = "#ef4444"
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, height - padding)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw current point
        ctx.fillStyle = "#ef4444"
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
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

    // Y-axis labels
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const pressure = minPressure + (i / 5) * (maxPressure - minPressure)
      const y = height - padding - (i / 5) * (height - 2 * padding)
      ctx.fillText(pressure.toFixed(2), padding - 10, y + 4)
    }

    // Title and axis labels
    ctx.textAlign = "center"
    ctx.font = "14px sans-serif"
    ctx.fillStyle = "#ffffff"
    ctx.fillText("Pressure vs Time", width / 2, 20)

    ctx.font = "12px sans-serif"
    ctx.fillStyle = "#d1d5db"
    ctx.fillText("Time (seconds)", width / 2, height - 5)

    // Y-axis label (rotated)
    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText("Pressure (bar)", 0, 0)
    ctx.restore()
  }, [data, currentFrame])

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Pressure Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} className="w-full h-[300px]" />
        {data.length === 0 && (
          <div className="flex items-center justify-center h-[300px] text-slate-400">No pressure data available</div>
        )}
      </CardContent>
    </Card>
  )
}
