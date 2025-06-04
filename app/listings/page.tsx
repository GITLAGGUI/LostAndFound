"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPinIcon,
  CalendarDaysIcon,
  TagIcon,
  SearchIcon,
  FilterIcon,
  UserIcon,
  DogIcon,
  BriefcaseIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import("@/components/leaflet-map"), { ssr: false })

// Mock data - replace with API calls
const mockItems = [
  {
    id: "1",
    type: "lost_item",
    category: "electronics",
    name: "iPhone 13 Pro",
    description: "Lost near Central Park. Blue color, slight crack on screen.",
    location: "Central Park, New York",
    lat: 40.7829,
    lng: -73.9654,
    date: "2024-05-28",
    image: "/placeholder.svg?width=300&height=200",
    status: "lost",
  },
  {
    id: "2",
    type: "found_item",
    category: "accessories",
    name: "Black Wallet",
    description: "Found wallet with credit cards and ID. Found at Times Square station.",
    location: "Times Square Station, New York",
    lat: 40.758,
    lng: -73.9855,
    date: "2024-05-30",
    image: "/placeholder.svg?width=300&height=200",
    status: "found",
  },
  {
    id: "3",
    type: "missing_pet",
    category: "pets",
    name: "Buddy (Golden Retriever)",
    description: "Lost my dog Buddy. He's very friendly, wearing a red collar.",
    location: "Brooklyn Bridge Park",
    lat: 40.7027,
    lng: -73.9906,
    date: "2024-05-25",
    image: "/placeholder.svg?width=300&height=200",
    status: "missing",
  },
  {
    id: "4",
    type: "missing_person",
    category: "people",
    name: "John Doe",
    description: "Missing person, last seen wearing a blue jacket and jeans.",
    location: "Grand Central Terminal",
    lat: 40.7527,
    lng: -73.9772,
    date: "2024-05-20",
    image: "/placeholder.svg?width=300&height=200",
    status: "missing",
  },
  {
    id: "5",
    type: "lost_item",
    category: "books",
    name: "Signed Copy of 'The Great Gatsby'",
    description: "Lost a valuable signed book on the subway.",
    location: "NYC Subway Line 5",
    lat: 40.7648,
    lng: -73.9808,
    date: "2024-06-01",
    image: "/placeholder.svg?width=300&height=200",
    status: "lost",
  },
]

const categoryIcons = {
  electronics: <BriefcaseIcon className="w-4 h-4" />,
  accessories: <BriefcaseIcon className="w-4 h-4" />,
  pets: <DogIcon className="w-4 h-4" />,
  people: <UserIcon className="w-4 h-4" />,
  books: <BriefcaseIcon className="w-4 h-4" />,
  default: <TagIcon className="w-4 h-4" />,
}

export default function ListingsPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || "all"

  const [listings, setListings] = useState(mockItems)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState(initialCategory)
  const [filterStatus, setFilterStatus] = useState("all") // "all", "lost", "found", "missing"
  const [viewMode, setViewMode] = useState("grid") // "grid" or "map"
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    // In a real app, fetch listings based on filters
    let filtered = mockItems
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (filterCategory !== "all") {
      if (filterCategory === "items") {
        filtered = filtered.filter((item) => item.type === "lost_item" || item.type === "found_item")
      } else {
        filtered = filtered.filter((item) => item.category === filterCategory)
      }
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus)
    }
    setListings(filtered)
  }, [searchTerm, filterCategory, filterStatus])

  const mapMarkers = useMemo(() => {
    return listings.map((item) => ({
      position: [item.lat, item.lng] as [number, number],
      popupContent: `<b>${item.name}</b><br/>${item.description.substring(0, 50)}...<br/><a href="/listings/${item.id}">View Details</a>`,
      itemData: item,
    }))
  }, [listings])

  const handleMarkerClick = (itemData: any) => {
    setSelectedItem(itemData)
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Listings</h1>
        <p className="text-muted-foreground mt-2">Browse lost and found items, missing pets, and people.</p>
      </header>

      {/* Filters and Search */}
      <Card className="mb-8 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or description..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-muted-foreground mb-1">
              Category
            </label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="items">General Items</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="pets">Pets</SelectItem>
                <SelectItem value="people">People</SelectItem>
                <SelectItem value="books">Books</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-muted-foreground mb-1">
              Status
            </label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="found">Found</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-primary text-primary-foreground" : ""}
            >
              Grid View
            </Button>
            <Button
              variant="outline"
              onClick={() => setViewMode("map")}
              className={viewMode === "map" ? "bg-primary text-primary-foreground" : ""}
            >
              Map View
            </Button>
          </div>
        </div>
      </Card>

      {/* View Mode Tabs (alternative to buttons) */}
      {/* <Tabs value={viewMode} onValueChange={setViewMode} className="mb-6">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>
      </Tabs> */}

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.length > 0 ? (
            listings.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                <CardHeader className="p-0">
                  <div className="relative w-full h-48">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} layout="fill" objectFit="cover" />
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full text-white ${item.status === "lost" || item.status === "missing" ? "bg-destructive" : "bg-green-500"}`}
                    >
                      {item.status.toUpperCase()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-2 h-16 overflow-hidden text-ellipsis">
                    {item.description}
                  </CardDescription>
                  <div className="flex items-center text-xs text-muted-foreground mb-1">
                    {categoryIcons[item.category as keyof typeof categoryIcons] || categoryIcons.default}
                    <span className="ml-1 capitalize">{item.category}</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mb-1">
                    <MapPinIcon className="w-4 h-4 mr-1" /> {item.location}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarDaysIcon className="w-4 h-4 mr-1" /> {item.date}
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <Button asChild variant="default" className="w-full">
                    <Link href={`/listings/${item.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-10">
              No listings found matching your criteria.
            </p>
          )}
        </div>
      )}

      {viewMode === "map" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          <div className="md:col-span-2 h-full rounded-lg overflow-hidden border">
            <LeafletMap markers={mapMarkers} onMarkerClick={handleMarkerClick} />
          </div>
          <div className="md:col-span-1 h-full overflow-y-auto p-4 border rounded-lg bg-card">
            {selectedItem ? (
              <Card className="overflow-hidden">
                <CardHeader className="p-0">
                  <div className="relative w-full h-40">
                    <Image
                      src={selectedItem.image || "/placeholder.svg"}
                      alt={selectedItem.name}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-1">{selectedItem.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-2">
                    {selectedItem.description}
                  </CardDescription>
                  <div className="flex items-center text-xs text-muted-foreground mb-1">
                    {categoryIcons[selectedItem.category as keyof typeof categoryIcons] || categoryIcons.default}
                    <span className="ml-1 capitalize">{selectedItem.category}</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mb-1">
                    <MapPinIcon className="w-4 h-4 mr-1" /> {selectedItem.location}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarDaysIcon className="w-4 h-4 mr-1" /> {selectedItem.date}
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <Button asChild variant="default" className="w-full">
                    <Link href={`/listings/${selectedItem.id}`}>View Full Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FilterIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Click on a map marker to see details here or apply filters to narrow down results.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
