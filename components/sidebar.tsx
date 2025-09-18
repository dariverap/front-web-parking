"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-guard"
import {
  Building2,
  Car,
  LayoutDashboard,
  Settings,
  Users,
  ParkingCircle,
  Menu,
  X,
  UserCheck,
  CreditCard,
  LogOut,
  MapPin,
} from "lucide-react"

const navigation = {
  admin_general: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Gestión de Parkings", href: "/parkings", icon: Building2 },
    { name: "Usuarios", href: "/users", icon: Users },
    { name: "Empleados", href: "/employees", icon: UserCheck },
    { name: "Configuración", href: "/settings", icon: Settings },
  ],
  admin_parking: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Mis Parkings", href: "/my-parkings", icon: ParkingCircle },
    { name: "Configuración", href: "/settings", icon: Settings },
  ],
  empleado: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Mi Parking", href: "/operations", icon: MapPin },
    { name: "Cobros", href: "/billing", icon: CreditCard },
  ],
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (!user) return null

  // Soportar estructura { success, data: { ...usuario } }
  const userData = (user as any)?.data ? (user as any).data : (user as any)

  const roleFromUser = (userData as any)?.rol ?? (userData as any)?.role
  const roleKey = (typeof roleFromUser === "string" ? roleFromUser.toLowerCase() : "") as keyof typeof navigation
  const navItems = navigation[roleKey] || navigation["empleado"] || []

  const displayName =
    (userData as any).name || `${(userData as any).nombre || ""} ${(userData as any).apellido || ""}`.trim() || "Usuario"
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-sidebar text-sidebar-foreground"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar transform transition-transform duration-150 ease-out md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
            <Car className="h-8 w-8 text-sidebar-accent" />
            <span className="ml-3 text-xl font-bold text-sidebar-foreground">ParkManager</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-100",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                  prefetch={true}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <span className="text-sm font-medium text-sidebar-accent-foreground">{initials}</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-sidebar-foreground">{displayName}</p>
                  <p className="text-xs text-sidebar-foreground/70">
                    {roleKey === "admin_general" && "Acceso completo"}
                    {roleKey === "admin_parking" && `${(user as any).parkings?.length || 0} parking${(((user as any).parkings?.length || 0) !== 1 ? "s" : "")}`}
                    {roleKey === "empleado" && "Empleado"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-sidebar-foreground hover:text-sidebar-accent"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  )
}

