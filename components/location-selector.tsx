"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Search, Navigation, Loader2 } from "lucide-react"

interface LocationSelectorProps {
  onLocationSelect: (location: { name: string; coordinates: [number, number] }) => void
  selectedLocation?: { name: string; coordinates: [number, number] } | null
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
  place_id: string
}

const POPULAR_LOCATIONS = [
  { name: "New York, NY", coordinates: [40.7128, -74.006] as [number, number] },
  { name: "Los Angeles, CA", coordinates: [34.0522, -118.2437] as [number, number] },
  { name: "London, UK", coordinates: [51.5074, -0.1278] as [number, number] },
  { name: "Tokyo, Japan", coordinates: [35.6762, 139.6503] as [number, number] },
  { name: "Paris, France", coordinates: [48.8566, 2.3522] as [number, number] },
  { name: "Berlin, Germany", coordinates: [52.52, 13.405] as [number, number] },
  { name: "Sydney, Australia", coordinates: [-33.8688, 151.2093] as [number, number] },
  { name: "Dubai, UAE", coordinates: [25.2048, 55.2708] as [number, number] },
]

export function LocationSelector({ onLocationSelect, selectedLocation }: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [manualCoords, setManualCoords] = useState({ lat: "", lon: "" })
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Debounced search function
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Using Nominatim API (OpenStreetMap geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      )

      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      }
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, searchLocations])

  const handleSearchResultSelect = (result: SearchResult) => {
    const location = {
      name: result.display_name.split(",").slice(0, 2).join(",").trim(),
      coordinates: [Number.parseFloat(result.lat), Number.parseFloat(result.lon)] as [number, number],
    }
    onLocationSelect(location)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleManualCoordinates = () => {
    const lat = Number.parseFloat(manualCoords.lat)
    const lon = Number.parseFloat(manualCoords.lon)

    if (isNaN(lat) || isNaN(lon)) {
      alert("Please enter valid coordinates")
      return
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert("Please enter valid coordinate ranges (lat: -90 to 90, lon: -180 to 180)")
      return
    }

    const location = {
      name: `Custom Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      coordinates: [lat, lon] as [number, number],
    }
    onLocationSelect(location)
    setManualCoords({ lat: "", lon: "" })
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser")
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const location = {
          name: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          coordinates: [latitude, longitude] as [number, number],
        }
        onLocationSelect(location)
        setIsGettingLocation(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        alert("Unable to get your current location. Please check your browser permissions.")
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Location
        </CardTitle>
        <CardDescription className="text-slate-400">
          Choose where to simulate the blast wave propagation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-green-300 font-medium">{selectedLocation.name}</p>
                <p className="text-green-400 text-sm">
                  {selectedLocation.coordinates[0].toFixed(4)}, {selectedLocation.coordinates[1].toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="location-search" className="text-slate-300">
            Search for a location
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="location-search"
              placeholder="Enter city, address, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSearchResultSelect(result)}
                  className="w-full text-left p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                  <p className="text-white text-sm">{result.display_name}</p>
                  <p className="text-slate-400 text-xs">
                    {Number.parseFloat(result.lat).toFixed(4)}, {Number.parseFloat(result.lon).toFixed(4)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular Locations */}
        <div className="space-y-2">
          <Label className="text-slate-300">Popular locations</Label>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_LOCATIONS.map((location) => (
              <Button
                key={location.name}
                variant="outline"
                size="sm"
                onClick={() => onLocationSelect(location)}
                className="justify-start border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700"
              >
                {location.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Manual Coordinates */}
        <div className="space-y-2">
          <Label className="text-slate-300">Manual coordinates</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Latitude"
              value={manualCoords.lat}
              onChange={(e) => setManualCoords((prev) => ({ ...prev, lat: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
            <Input
              placeholder="Longitude"
              value={manualCoords.lon}
              onChange={(e) => setManualCoords((prev) => ({ ...prev, lon: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
          <Button
            onClick={handleManualCoordinates}
            disabled={!manualCoords.lat || !manualCoords.lon}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Use Coordinates
          </Button>
        </div>

        {/* Current Location */}
        <Button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          variant="outline"
          className="w-full border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          Use Current Location
        </Button>
      </CardContent>
    </Card>
  )
}
