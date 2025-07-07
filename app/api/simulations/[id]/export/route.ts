import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    // Generate mock simulation data
    const frames = Array.from({ length: 250 }, (_, i) => ({
      time: i * 0.1,
      pressure: 15 * Math.exp(-i * 0.02) * Math.max(0, 1 - i * 0.004),
      velocity: 350 * Math.exp(-i * 0.015) * Math.max(0, Math.sin(i * 0.05)),
      temperature: 300 + 2000 * Math.exp(-i * 0.03),
    }))

    if (format === "csv") {
      const csvHeader = "Time (s),Pressure (bar),Velocity (m/s),Temperature (K)\n"
      const csvData = frames
        .map(
          (frame) =>
            `${frame.time.toFixed(3)},${frame.pressure.toFixed(2)},${frame.velocity.toFixed(2)},${frame.temperature.toFixed(1)}`,
        )
        .join("\n")

      const csvContent = csvHeader + csvData

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="simulation_${id}.csv"`,
        },
      })
    } else if (format === "json") {
      const jsonData = {
        simulationId: id,
        exportedAt: new Date().toISOString(),
        frames,
      }

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="simulation_${id}.json"`,
        },
      })
    } else {
      return NextResponse.json({ error: "Unsupported format. Use csv or json." }, { status: 400 })
    }
  } catch (error) {
    console.error("Error exporting simulation:", error)
    return NextResponse.json({ error: "Failed to export simulation" }, { status: 500 })
  }
}
