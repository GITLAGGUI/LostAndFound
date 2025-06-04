"use client"

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L, { type LatLng } from "leaflet"
import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { LocateFixedIcon } from "lucide-react"

// Fix for default Leaflet icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

interface LeafletMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  initialPosition?: [number, number]
}

function LocationMarker({
  onLocationSelect,
  initialPosition,
}: LeafletMapPickerProps & { initialPosition?: [number, number] }) {
  const [position, setPosition] = useState<LatLng | null>(
    initialPosition ? L.latLng(initialPosition[0], initialPosition[1]) : null,
  )
  const map = useMap()

  useEffect(() => {
    if (initialPosition) {
      const newPos = L.latLng(initialPosition[0], initialPosition[1])
      setPosition(newPos)
      map.setView(newPos, map.getZoom() < 13 ? 13 : map.getZoom()) // Zoom in if current zoom is too far out
    } else {
      // Try to geolocate user if no initial position
      map.locate({ setView: true, maxZoom: 16 })
    }
  }, [initialPosition, map])

  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      // Basic reverse geocoding (requires a service for real addresses)
      // For demo, just pass lat/lng
      onLocationSelect(e.latlng.lat, e.latlng.lng, `Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`)
    },
    locationfound(e) {
      if (!initialPosition) {
        // Only set if no initial position was provided
        setPosition(e.latlng)
        map.flyTo(e.latlng, map.getZoom())
        onLocationSelect(e.latlng.lat, e.latlng.lng, `Current Location (approx.)`)
      }
    },
    locationerror(e) {
      console.error("Location access denied or unavailable.", e.message)
      // Fallback if geolocation fails and no initial position
      if (!initialPosition && !position) {
        const fallbackPos = L.latLng(40.7128, -74.006) // NYC
        setPosition(fallbackPos)
        map.setView(fallbackPos, 10)
        onLocationSelect(fallbackPos.lat, fallbackPos.lng, "Default Location (NYC)")
      }
    },
  })

  return position === null ? null : <Marker position={position}></Marker>
}

export default function LeafletMapPicker({ onLocationSelect, initialPosition }: LeafletMapPickerProps) {
  if (typeof window === "undefined") {
    return null
  }

  const defaultCenter: [number, number] = initialPosition || [40.7128, -74.006] // NYC or initial
  const defaultZoom = initialPosition ? 15 : 10

  return (
    <div className="relative h-full w-full">
      <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker onLocationSelect={onLocationSelect} initialPosition={initialPosition} />
      </MapContainer>
      <div className="absolute top-2 right-2 z-[1000]">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => {
            const map = (document.querySelector(".leaflet-container") as any)?.__leaflet_map
            if (map) map.locate({ setView: true, maxZoom: 16 })
          }}
          title="Use my current location"
        >
          <LocateFixedIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-background/80 p-2 rounded-md text-sm text-center">
        Click on the map to select a location.
      </div>
    </div>
  )
}
