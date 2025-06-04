"use client" // [^1]

import Link from "next/link"
import {
  HomeIcon,
  ListIcon,
  PlusCircleIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  MountainIcon,
  UsersIcon,
  DogIcon,
  BriefcaseIcon,
  HelpCircleIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar" // [^1]
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import { useAuth } from "@/contexts/AuthContext"

export function AppSidebar() {
  const pathname = usePathname()
  const { isAdmin } = useAuth()

  const menuItems = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/listings", label: "All Listings", icon: ListIcon },
    { href: "/report?type=lost", label: "Report Lost", icon: PlusCircleIcon },
    { href: "/report?type=found", label: "Report Found", icon: PlusCircleIcon },
    {
      label: "Categories",
      icon: BriefcaseIcon,
      subItems: [
        { href: "/listings?category=items", label: "Lost Items", icon: BriefcaseIcon },
        { href: "/listings?category=pets", label: "Missing Pets", icon: DogIcon },
        { href: "/listings?category=people", label: "Missing People", icon: UsersIcon },
      ],
    },
    { href: "/dashboard", label: "My Dashboard", icon: LayoutDashboardIcon },
    { href: "/help", label: "AI Help", icon: HelpCircleIcon },
  ]

  // Only add admin panel if user is admin
  if (isAdmin) {
    menuItems.push({ href: "/admin", label: "Admin Panel", icon: ShieldCheckIcon })
  }

  return (
    <Sidebar collapsible="icon">
      {" "}
      {/* [^1] */}
      <SidebarHeader className="p-4 border-b">
        {" "}
        {/* [^1] */}
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <MountainIcon className="h-8 w-8 text-primary" />
          <span className="font-semibold text-xl group-data-[collapsible=icon]:hidden">
            {" "}
            {/* [^1] */}
            LostFound
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        {" "}
        {/* [^1] */}
        <SidebarMenu>
          {" "}
          {/* [^1] */}
          {menuItems.map((item) =>
            item.subItems ? (
              <SidebarGroup key={item.label} className="p-0">
                {" "}
                {/* [^1] */}
                <SidebarGroupLabel className="px-2 py-1 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">
                  {" "}
                  {/* [^1] */}
                  {item.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  {" "}
                  {/* [^1] */}
                  {item.subItems.map((subItem) => (
                    <SidebarMenuItem key={subItem.href}>
                      {" "}
                      {/* [^1] */}
                      <SidebarMenuButton // [^1]
                        asChild
                        isActive={pathname === subItem.href}
                        tooltip={subItem.label}
                      >
                        <Link href={subItem.href} className="flex items-center gap-3">
                          <subItem.icon className="h-5 w-5" />
                          <span className="group-data-[collapsible=icon]:hidden">{subItem.label}</span> {/* [^1] */}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
            ) : (
              <SidebarMenuItem key={item.href}>
                {" "}
                {/* [^1] */}
                <SidebarMenuButton // [^1]
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span> {/* [^1] */}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        {" "}
        {/* [^1] */}
        <div className="text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
          FindIt - Lost & Found Platform
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
