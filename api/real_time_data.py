import asyncio
import aiohttp
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import numpy as np
from xml.etree import ElementTree as ET

@dataclass
class BoundingBox:
    south: float
    west: float
    north: float
    east: float

@dataclass
class OSMBuilding:
    id: str
    coordinates: List[List[float]]
    tags: Dict[str, str]
    calculated_height: float

@dataclass
class OSMRoad:
    id: str
    coordinates: List[List[float]]
    tags: Dict[str, str]

@dataclass
class ElevationPoint:
    lat: float
    lng: float
    elevation: float

class RealTimeDataFetcher:
    def __init__(self):
        self.overpass_url = "https://overpass-api.de/api/interpreter"
        self.elevation_url = "https://api.open-elevation.com/api/v1/lookup"
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def fetch_osm_buildings(self, bbox: BoundingBox) -> List[OSMBuilding]:
        """Fetch building data from OpenStreetMap Overpass API"""
        query = f"""
        [out:json][timeout:25];
        (
          way["building"]({bbox.south},{bbox.west},{bbox.north},{bbox.east});
          relation["building"]({bbox.south},{bbox.west},{bbox.north},{bbox.east});
        );
        out body;
        >;
        out skel qt;
        """

        try:
            async with self.session.post(
                self.overpass_url,
                data={"data": query},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            ) as response:
                if response.status != 200:
                    raise Exception(f"OSM API error: {response.status}")
                
                data = await response.json()
                return self._process_buildings(data)
                
        except Exception as e:
            print(f"Error fetching OSM buildings: {e}")
            return []

    async def fetch_osm_roads(self, bbox: BoundingBox) -> List[OSMRoad]:
        """Fetch road data from OpenStreetMap Overpass API"""
        query = f"""
        [out:json][timeout:25];
        (
          way["highway"~"^(primary|secondary|tertiary|residential|trunk|motorway)$"]({bbox.south},{bbox.west},{bbox.north},{bbox.east});
        );
        out body;
        >;
        out skel qt;
        """

        try:
            async with self.session.post(
                self.overpass_url,
                data={"data": query},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            ) as response:
                if response.status != 200:
                    raise Exception(f"OSM API error: {response.status}")
                
                data = await response.json()
                return self._process_roads(data)
                
        except Exception as e:
            print(f"Error fetching OSM roads: {e}")
            return []

    async def fetch_elevation_data(self, bbox: BoundingBox, resolution: float = 0.001) -> List[List[float]]:
        """Fetch elevation data from Open-Elevation API"""
        try:
            # Generate grid points
            lat_range = bbox.north - bbox.south
            lng_range = bbox.east - bbox.west
            lat_steps = int(lat_range / resolution)
            lng_steps = int(lng_range / resolution)

            elevations = []
            batch_size = 100  # API rate limiting

            for i in range(lat_steps):
                row = []
                lat = bbox.south + (i * lat_range) / lat_steps

                # Process in batches
                for j in range(0, lng_steps, batch_size):
                    batch_points = []
                    for k in range(j, min(j + batch_size, lng_steps)):
                        lng = bbox.west + (k * lng_range) / lng_steps
                        batch_points.append({"latitude": lat, "longitude": lng})

                    batch_elevations = await self._fetch_elevation_batch(batch_points)
                    row.extend(batch_elevations)

                    # Rate limiting delay
                    if j + batch_size < lng_steps:
                        await asyncio.sleep(0.1)

                elevations.append(row)

            return elevations

        except Exception as e:
            print(f"Error fetching elevation data: {e}")
            # Return flat terrain as fallback
            lat_steps = int((bbox.north - bbox.south) / resolution)
            lng_steps = int((bbox.east - bbox.west) / resolution)
            return [[0.0 for _ in range(lng_steps)] for _ in range(lat_steps)]

    async def _fetch_elevation_batch(self, points: List[Dict[str, float]]) -> List[float]:
        """Fetch elevation for a batch of points"""
        try:
            async with self.session.post(
                self.elevation_url,
                json={"locations": points},
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status != 200:
                    raise Exception(f"Elevation API error: {response.status}")
                
                data = await response.json()
                return [result.get("elevation", 0.0) for result in data["results"]]
                
        except Exception as e:
            print(f"Elevation batch fetch failed: {e}")
            return [0.0] * len(points)

    def _process_buildings(self, osm_data: Dict[str, Any]) -> List[OSMBuilding]:
        """Process OSM building data"""
        nodes = {}
        buildings = []

        # Collect nodes
        for element in osm_data.get("elements", []):
            if element["type"] == "node":
                nodes[element["id"]] = [element["lon"], element["lat"]]

        # Process ways and relations
        for element in osm_data.get("elements", []):
            if element["type"] in ["way", "relation"] and element.get("tags", {}).get("building"):
                coordinates = []

                if element["type"] == "way" and "nodes" in element:
                    for node_id in element["nodes"]:
                        if node_id in nodes:
                            coordinates.append(nodes[node_id])

                if len(coordinates) > 0:
                    height = self._calculate_building_height(element.get("tags", {}))
                    buildings.append(OSMBuilding(
                        id=str(element["id"]),
                        coordinates=coordinates,
                        tags=element.get("tags", {}),
                        calculated_height=height
                    ))

        return buildings

    def _process_roads(self, osm_data: Dict[str, Any]) -> List[OSMRoad]:
        """Process OSM road data"""
        nodes = {}
        roads = []

        # Collect nodes
        for element in osm_data.get("elements", []):
            if element["type"] == "node":
                nodes[element["id"]] = [element["lon"], element["lat"]]

        # Process ways
        for element in osm_data.get("elements", []):
            if element["type"] == "way" and element.get("tags", {}).get("highway"):
                coordinates = []

                if "nodes" in element:
                    for node_id in element["nodes"]:
                        if node_id in nodes:
                            coordinates.append(nodes[node_id])

                if len(coordinates) > 0:
                    roads.append(OSMRoad(
                        id=str(element["id"]),
                        coordinates=coordinates,
                        tags=element.get("tags", {})
                    ))

        return roads

    def _calculate_building_height(self, tags: Dict[str, str]) -> float:
        """Calculate building height from OSM tags"""
        # Try explicit height first
        if "height" in tags:
            try:
                height_str = tags["height"].replace("m", "").replace("ft", "").strip()
                height = float(height_str)
                # Convert feet to meters if needed
                if "ft" in tags["height"]:
                    height *= 0.3048
                return height
            except ValueError:
                pass

        # Estimate from building levels
        if "building:levels" in tags:
            try:
                levels = int(tags["building:levels"])
                return levels * 3.5  # Assume 3.5m per level
            except ValueError:
                pass

        # Default heights by building type
        building_type = tags.get("building", "yes")
        default_heights = {
            "house": 8.0,
            "residential": 12.0,
            "apartments": 25.0,
            "commercial": 15.0,
            "office": 30.0,
            "industrial": 12.0,
            "warehouse": 10.0,
            "hospital": 20.0,
            "school": 12.0,
            "church": 15.0,
            "yes": 10.0,  # Generic building
        }

        return default_heights.get(building_type, 10.0)

# FastAPI endpoint integration
from fastapi import HTTPException

async def get_real_time_urban_data(bbox_str: str) -> Dict[str, Any]:
    """Fetch real-time urban data for simulation"""
    try:
        # Parse bounding box
        coords = [float(x) for x in bbox_str.split(',')]
        if len(coords) != 4:
            raise ValueError("Invalid bounding box format")
        
        bbox = BoundingBox(
            south=coords[0],
            west=coords[1], 
            north=coords[2],
            east=coords[3]
        )

        async with RealTimeDataFetcher() as fetcher:
            # Fetch all data concurrently
            buildings_task = fetcher.fetch_osm_buildings(bbox)
            roads_task = fetcher.fetch_osm_roads(bbox)
            elevation_task = fetcher.fetch_elevation_data(bbox)

            buildings, roads, elevations = await asyncio.gather(
                buildings_task, roads_task, elevation_task
            )

            return {
                "bbox": {
                    "south": bbox.south,
                    "west": bbox.west,
                    "north": bbox.north,
                    "east": bbox.east
                },
                "buildings": [
                    {
                        "id": b.id,
                        "coordinates": b.coordinates,
                        "tags": b.tags,
                        "height": b.calculated_height
                    } for b in buildings
                ],
                "roads": [
                    {
                        "id": r.id,
                        "coordinates": r.coordinates,
                        "tags": r.tags
                    } for r in roads
                ],
                "elevation": {
                    "data": elevations,
                    "resolution": 0.001,
                    "width": len(elevations[0]) if elevations else 0,
                    "height": len(elevations)
                },
                "metadata": {
                    "buildings_count": len(buildings),
                    "roads_count": len(roads),
                    "data_sources": ["OpenStreetMap", "Open-Elevation"],
                    "timestamp": asyncio.get_event_loop().time()
                }
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching real-time data: {str(e)}")
