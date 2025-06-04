"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  MapPinIcon,
  CalendarDaysIcon,
  TagIcon,
  UserIcon,
  MessageSquareIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  SendIcon,
  PhoneIcon,
  MailIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useToast } from "@/components/ui/use-toast"

const LeafletMap = dynamic(() => import("@/components/leaflet-map"), { ssr: false })

// Mock data - replace with API call to fetch item by ID
const mockItems = [
  {
    id: "1",
    type: "lost_item",
    category: "electronics",
    name: "iPhone 13 Pro",
    description:
      "Lost near Central Park. Blue color, slight crack on screen. Serial number: XXXXXX. Last seen around 3 PM on May 28th. It was in a black Spigen case.",
    location: "Central Park, New York",
    lat: 40.7829,
    lng: -73.9654,
    date: "2024-05-28",
    image: "/placeholder.svg?width=600&height=400",
    status: "lost",
    reportedBy: { name: "Alice Smith", avatar: "/placeholder-user.jpg", email: "alice@example.com", phone: "555-1234" },
    reward: 50,
  },
  {
    id: "2",
    type: "found_item",
    category: "accessories",
    name: "Black Wallet",
    description:
      "Found wallet with credit cards (Visa ending 1234, Mastercard ending 5678) and ID for John B. Doe. Found at Times Square station, near the turnstiles for NQRW lines.",
    location: "Times Square Station, New York",
    lat: 40.758,
    lng: -73.9855,
    date: "2024-05-30",
    image: "/placeholder.svg?width=600&height=400",
    status: "found",
    reportedBy: { name: "Bob Johnson", avatar: "/placeholder-user.jpg", email: "bob@example.com" },
  },
  {
    id: "3",
    type: "missing_pet",
    category: "pets",
    name: "Buddy (Golden Retriever)",
    description:
      "Lost my dog Buddy. He's very friendly, 3 years old, male, neutered. Wearing a red collar with a tag that has my phone number. Microchipped. Last seen chasing a squirrel towards the east side of Brooklyn Bridge Park.",
    location: "Brooklyn Bridge Park",
    lat: 40.7027,
    lng: -73.9906,
    date: "2024-05-25",
    image: "/placeholder.svg?width=600&height=400",
    status: "missing",
    reportedBy: {
      name: "Carol Williams",
      avatar: "/placeholder-user.jpg",
      email: "carol@example.com",
      phone: "555-5678",
    },
  },
  {
    id: "4",
    type: "missing_person",
    category: "people",
    name: "John Doe",
    description:
      "Missing person, John Doe, 72 years old, 5'10\", white male, grey hair, blue eyes. Last seen wearing a blue jacket, jeans, and a Yankees cap. May be disoriented, suffers from mild dementia. Last seen near the information booth at Grand Central Terminal.",
    location: "Grand Central Terminal",
    lat: 40.7527,
    lng: -73.9772,
    date: "2024-05-20",
    image: "/placeholder.svg?width=600&height=400",
    status: "missing",
    reportedBy: {
      name: "Family of John Doe",
      avatar: "/placeholder-user.jpg",
      email: "family@example.com",
      phone: "555-9012",
    },
  },
]

const mockComments = [
  {
    id: "c1",
    itemId: "1",
    user: { name: "Finder Helper", avatar: "/placeholder-user.jpg" },
    text: "I think I saw a phone like this near the park entrance yesterday. Was it near the carousel?",
    date: "2024-05-29",
  },
  {
    id: "c2",
    itemId: "1",
    user: { name: "Alice Smith", avatar: "/placeholder-user.jpg" },
    text: "Yes! It was near the carousel. Thank you for the tip!",
    date: "2024-05-29",
    isOwner: true,
  },
  {
    id: "c3",
    itemId: "3",
    user: { name: "Park Ranger", avatar: "/placeholder-user.jpg" },
    text: "We'll keep an eye out for Buddy. Can you confirm if he responds to any specific calls?",
    date: "2024-05-26",
  },
]

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [item, setItem] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    if (params.id) {
      // Simulate API call
      setTimeout(() => {
        const foundItem = mockItems.find((i) => i.id === params.id)
        const itemComments = mockComments.filter((c) => c.itemId === params.id)
        if (foundItem) {
          setItem(foundItem)
          setComments(itemComments)
        } else {
          toast({ title: "Error", description: "Listing not found.", variant: "destructive" })
          router.push("/listings")
        }
        setIsLoading(false)
      }, 500)
    }
  }, [params.id, router, toast])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setIsSubmittingComment(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newCommentData = {
      id: `c${comments.length + Math.random()}`, // temp id
      itemId: item.id,
      user: { name: "Current User", avatar: "/placeholder-user.jpg" }, // Replace with actual user
      text: newComment,
      date: new Date().toISOString().split("T")[0],
      isOwner: false, // Or true if current user is owner
    }
    setComments((prev) => [...prev, newCommentData])
    setNewComment("")
    setIsSubmittingComment(false)
    toast({ title: "Comment posted!" })
  }

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4 md:px-6 text-center">Loading listing details...</div>
  }

  if (!item) {
    return <div className="container mx-auto py-8 px-4 md:px-6 text-center">Listing not found.</div>
  }

  const mapMarkers = [{ position: [item.lat, item.lng] as [number, number], popupContent: item.name }]

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Listings
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl lg:text-4xl">{item.name}</CardTitle>
                  <CardDescription className="text-lg capitalize">
                    {item.type.replace("_", " ")} - {item.category}
                  </CardDescription>
                </div>
                <span
                  className={`px-3 py-1.5 text-sm font-semibold rounded-full text-white ${item.status === "lost" || item.status === "missing" ? "bg-destructive" : item.status === "found" ? "bg-green-500" : "bg-yellow-500"}`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6 border">
                <Image src={item.image || "/placeholder.svg"} alt={item.name} layout="fill" objectFit="cover" />
              </div>

              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-line mb-6">{item.description}</p>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold flex items-center">
                    <CalendarDaysIcon className="w-5 h-5 mr-2 text-primary" /> Date Reported
                  </h4>
                  <p className="text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2 text-primary" /> Location
                  </h4>
                  <p className="text-muted-foreground">{item.location}</p>
                </div>
                {item.reward && (
                  <div>
                    <h4 className="font-semibold flex items-center text-green-600">
                      <TagIcon className="w-5 h-5 mr-2" /> Reward Offered
                    </h4>
                    <p className="text-muted-foreground">${item.reward}</p>
                  </div>
                )}
              </div>

              <div className="h-80 w-full rounded-lg overflow-hidden border">
                <LeafletMap markers={mapMarkers} center={[item.lat, item.lng]} zoom={15} />
              </div>
            </CardContent>
          </Card>

          {/* Comments/Messages Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquareIcon className="w-6 h-6 mr-2 text-primary" /> Community Discussion
              </CardTitle>
              <CardDescription>Ask questions or share information about this listing.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3">
                <Textarea
                  placeholder="Write a comment or message..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button type="submit" disabled={isSubmittingComment}>
                  {isSubmittingComment ? (
                    "Submitting..."
                  ) : (
                    <>
                      <SendIcon className="w-4 h-4 mr-2" /> Post Comment
                    </>
                  )}
                </Button>
              </form>
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`flex gap-3 p-3 rounded-md ${comment.isOwner ? "bg-primary/10 border-l-4 border-primary" : "bg-muted/50"}`}
                    >
                      <Avatar className="mt-1">
                        <AvatarImage src={comment.user.avatar || "/placeholder.svg"} alt={comment.user.name} />
                        <AvatarFallback>{comment.user.name.substring(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {comment.user.name}{" "}
                            {comment.isOwner && <span className="text-xs text-primary">(Reporter)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center">No comments yet. Be the first to say something!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="w-6 h-6 mr-2 text-primary" /> Reported By
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 mb-3">
                <AvatarImage src={item.reportedBy.avatar || "/placeholder.svg"} alt={item.reportedBy.name} />
                <AvatarFallback>{item.reportedBy.name.substring(0, 1)}</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-lg">{item.reportedBy.name}</p>
              {/* Display contact info based on user preferences / item type */}
              {item.reportedBy.email && (
                <Link
                  href={`mailto:${item.reportedBy.email}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <MailIcon className="w-3 h-3" /> {item.reportedBy.email}
                </Link>
              )}
              {item.reportedBy.phone && (
                <Link
                  href={`tel:${item.reportedBy.phone}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <PhoneIcon className="w-3 h-3" /> {item.reportedBy.phone}
                </Link>
              )}
              <Button className="mt-4 w-full">
                <MessageSquareIcon className="w-4 h-4 mr-2" /> Contact Reporter
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400 text-sm">
                <AlertTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" /> Safety Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-yellow-600 dark:text-yellow-300 space-y-1 overflow-hidden">
              <ul className="list-disc pl-4 space-y-1">
                <li className="overflow-hidden text-ellipsis">Always meet in a public place.</li>
                <li className="overflow-hidden text-ellipsis">Verify identity before returning items.</li>
                <li className="overflow-hidden text-ellipsis">Be cautious of suspicious requests.</li>
                <li className="overflow-hidden text-ellipsis">Never share sensitive personal information.</li>
              </ul>
            </CardContent>
          </Card>

          {item.status !== "resolved" && (
            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
              <CheckCircle2Icon className="w-5 h-5 mr-2" /> Mark as Resolved / Reunited
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
