"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]
  const isAuthRoute = authRoutes.includes(pathname || "")

  if (isAuthRoute) {
    // Rutas públicas de autenticación: sin Sidebar ni AuthGuard ni offsets
    return (
      <div className="min-h-screen bg-background">
        <main className="min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    )
  }

  // Resto de rutas: layout protegido con Sidebar
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 overflow-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
