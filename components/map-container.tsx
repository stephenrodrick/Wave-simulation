"use client"

import { useEffect, useRef } from "react"

interface MapContainerProps {
  center: [number, number]
  zoom: number
}

export function MapContainer({ center, zoom }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // This would integrate with MapLibre GL JS in a real implementation
    // For now, we'll show a placeholder with OpenStreetMap styling
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div style="
          width: 100%; 
          height: 100%; 
          background: linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                      linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                      linear-gradient(-45deg, transparent 75%, #1e293b 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 14px;
        ">
          <div style="text-align: center; background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 8px;">
            <div style="margin-bottom: 8px;">📍 Interactive Map</div>
            <div style="font-size: 12px; opacity: 0.7;">
              Lat: ${center[0].toFixed(4)}<br/>
              Lng: ${center[1].toFixed(4)}<br/>
              Zoom: ${zoom}
            </div>
          </div>
        </div>
      `
    }
  }, [center, zoom])

  return <div ref={mapRef} className="w-full h-full bg-slate-800 rounded-lg" style={{ minHeight: "400px" }} />
}
