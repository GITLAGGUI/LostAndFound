"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect } from "react"

// Fix for default Leaflet icon path issues with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

interface MapMarker {
  position: [number, number]
  popupContent?: string
  itemData?: any // Optional: pass full item data for click handling
}

interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  markers?: MapMarker[]
  onMarkerClick?: (itemData: any) => void // Callback for marker click
}

// Component to update map view when markers change
function MapUpdater({ markers }: { markers?: MapMarker[] }) {
  const map = useMap()
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((marker) => marker.position))
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    } else {
      // Default view if no markers
      map.setView([40.7128, -74.006], 10) // New York City
    }
  }, [markers, map])
  return null
}

export default function LeafletMap({
  center = [40.7128, -74.006], // Default to New York City
  zoom = 10,
  markers = [],
  onMarkerClick,
}: LeafletMapProps) {
  if (typeof window === "undefined") {
    return null // Don't render on server
  }

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater markers={markers} />
      {markers.map((marker, index) => (
        <Marker
          key={index}
          position={marker.position}
          eventHandlers={{
            click: () => {
              if (onMarkerClick && marker.itemData) {
                onMarkerClick(marker.itemData)
              }
            },
          }}
        >
          {marker.popupContent && <Popup>{marker.popupContent}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  )
}
