import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"
import { AuthProvider } from "@/contexts/AuthContext"
import { Suspense } from "react"
import { ClientMessagingSystem } from "@/components/client-messaging"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
})

export const metadata = {
  title: "FindIt - Lost & Found Platform",  
  description: "AI-powered platform to report and find lost items, pets, and people with image recognition and smart matching.",
  generator: 'Next.js',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SidebarProvider>
              <div className="flex min-h-screen w-full flex-col">
                <Suspense fallback={<div className="h-16 bg-background border-b" />}>
                  <Navbar />
                </Suspense>
                <div className="flex flex-1">
                  <Suspense fallback={<div className="w-64 bg-background border-r" />}>
                    <AppSidebar />
                  </Suspense>
                  <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      {children}
                    </Suspense>
                  </main>
                </div>
              </div>
              <ClientMessagingSystem />
            </SidebarProvider>
          </AuthProvider>
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  )
}