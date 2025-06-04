'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, Camera, X, MapPin, Calendar, DollarSign } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const reportSchema = z.object({
  type: z.enum(['lost', 'found']),
  category: z.enum(['item', 'person', 'pet']),
  subcategory: z.string().min(1, 'Please select a subcategory'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(5, 'Please provide a specific location'),
  date: z.string().min(1, 'Please select a date'),
  contactInfo: z.string().min(5, 'Please provide contact information'),
  reward: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  brand: z.string().optional(),
  distinctiveFeatures: z.string().optional(),
})

type ReportFormData = z.infer<typeof reportSchema>

const subcategories = {
  item: ['Electronics', 'Jewelry', 'Clothing', 'Bags/Wallets', 'Keys', 'Documents', 'Sports Equipment', 'Books', 'Others'],
  person: ['Missing Person', 'Lost Contact', 'Family Member', 'Friend', 'Others'],
  pet: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Others']
}

interface ReportFormProps {
  type: 'lost' | 'found'
}

export function ReportForm({ type }: ReportFormProps) {
  const [images, setImages] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type,
      category: 'item',
      subcategory: '',
      title: '',
      description: '',
      location: '',
      date: '',
      contactInfo: '',
      reward: '',
      color: '',
      size: '',
      brand: '',
      distinctiveFeatures: '',
    },
  })

  const watchedCategory = form.watch('category')

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return

    setUploadingImage(true)
    const newImages: File[] = []
    const newPreviews: string[] = []

    for (let i = 0; i < Math.min(files.length, 5 - images.length); i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        newImages.push(file)
        newPreviews.push(URL.createObjectURL(file))
      }
    }

    setImages(prev => [...prev, ...newImages])
    setImagePreview(prev => [...prev, ...newPreviews])
    setUploadingImage(false)
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreview[index])
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreview(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      return data.success ? data.url : null
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to report items')
        router.push('/auth')
        return
      }

      // Upload images first
      const imageUrls: string[] = []
      for (const image of images) {
        const url = await uploadImageToStorage(image)
        if (url) {
          imageUrls.push(url)
        } else {
          toast.error(`Failed to upload image: ${image.name}`)
        }
      }

      // Create report data with proper field mapping
      const reportData = {
        user_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        location: data.location,
        date: data.date,
        images: imageUrls,
        contactInfo: data.contactInfo,
        reward: data.reward,
        color: data.color,
        size: data.size,
        brand: data.brand,
        distinctiveFeatures: data.distinctiveFeatures,
      }

      console.log('Submitting report:', { type, reportData })

      const endpoint = data.type === 'lost' ? '/api/lost-items' : '/api/found-items'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      })

      const result = await response.json()
      console.log('API Response:', result)

      if (result.success) {
        toast.success(result.message || `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`)
        
        if (type === 'found' && result.potentialMatches > 0) {
          toast.info(`Found ${result.potentialMatches} potential matches!`)
        }
        
        // Clear form
        form.reset()
        setImages([])
        setImagePreview([])
        
        // Show success and redirect
        setTimeout(() => {
          router.push('/listings')
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to create report')
      }
    } catch (error) {
      console.error('Error creating report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {type === 'lost' ? (
              <>
                <MapPin className="h-5 w-5 text-red-500" />
                Report Lost Item
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 text-green-500" />
                Report Found Item
              </>
            )}
          </CardTitle>
          <CardDescription>
            Please provide as much detail as possible to help others identify the {type} item.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="item">Item/Object</SelectItem>
                          <SelectItem value="person">Person</SelectItem>
                          <SelectItem value="pet">Pet</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subcategories[watchedCategory]?.map((sub) => (
                            <SelectItem key={sub} value={sub}>
                              {sub}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Black leather wallet or Golden retriever"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a detailed description including size, color, brand, distinctive features, etc."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Location {type === 'lost' ? 'Last Seen' : 'Found'} *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Central Park near the fountain"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date {type === 'lost' ? 'Lost' : 'Found'} *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color(s)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Black, Brown"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Medium, 15cm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand/Make</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Nike, Apple"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="distinctiveFeatures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distinctive Features</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any unique marks, damage, engravings, or special characteristics..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Information *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Phone number or email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {type === 'lost' && (
                  <FormField
                    control={form.control}
                    name="reward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Reward Amount (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <Label>Images (Up to 5)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-400">
                      PNG, JPG up to 10MB each
                    </span>
                  </label>
                </div>

                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? 'Creating Report...' : `Report ${type === 'lost' ? 'Lost' : 'Found'} Item`}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}