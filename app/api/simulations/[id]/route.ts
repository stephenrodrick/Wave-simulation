import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Generate mock simulation data for any valid ID
    const mockSimulation = {
      id,
      name: `Simulation ${id}`,
      status: "completed",
      config: {
        explosiveType: "TNT",
        explosiveMass: 1000,
        coordinates: [40.7128, -74.006] as [number, number],
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

    return NextResponse.json(mockSimulation)
  } catch (error) {
    console.error("Error fetching simulation:", error)
    return NextResponse.json({ error: "Failed to fetch simulation" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    // Mock update response
    return NextResponse.json({
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating simulation:", error)
    return NextResponse.json({ error: "Failed to update simulation" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Mock delete response
    return NextResponse.json({
      message: `Simulation ${id} deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting simulation:", error)
    return NextResponse.json({ error: "Failed to delete simulation" }, { status: 500 })
  }
}
