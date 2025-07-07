import { type NextRequest, NextResponse } from "next/server"

// Mock simulations database
const mockSimulations = [
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredSimulations = mockSimulations

    // Filter by status if provided
    if (status) {
      filteredSimulations = mockSimulations.filter((sim) => sim.status === status)
    }

    // Apply pagination
    const paginatedSimulations = filteredSimulations.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      simulations: paginatedSimulations,
      total: filteredSimulations.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching simulations:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["name", "explosiveType", "explosiveMass", "coordinates"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 },
        )
      }
    }

    // Generate new simulation ID
    const newId = `sim_${Date.now()}`

    const newSimulation = {
      id: newId,
      name: body.name,
      description: body.description || "",
      status: "pending",
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      config: {
        explosiveType: body.explosiveType,
        explosiveMass: body.explosiveMass,
        coordinates: body.coordinates,
        location: body.location || "Custom Location",
        dataSource: body.dataSource || "sample",
        pinnModel: body.pinnModel || "pretrained",
      },
    }

    // Add to mock database
    mockSimulations.push(newSimulation)

    return NextResponse.json(
      {
        success: true,
        simulation: newSimulation,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating simulation:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
