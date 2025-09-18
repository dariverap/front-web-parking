"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

interface User {
  email?: string
  rol: "admin_general" | "admin_parking" | "empleado" | "cliente"
  name?: string
  parkings?: string[]
}

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: Array<"admin_general" | "admin_parking" | "empleado">
}

let globalUser: User | null = null
let isInitialized = false

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(globalUser)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Rutas públicas de autenticación
    if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password") {
      setIsLoading(false)
      return
    }

    const init = async () => {
      // No activar loading agresivo en cada navegación; usar usuario cacheado y refrescar en background
      try {
        // Si hay token, obtenemos/actualizamos el usuario
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (!token) {
          router.replace("/login")
          return
        }

        // Usar usuario cacheado para evitar parpadeo
        let current = globalUser
        if (!current && typeof window !== "undefined") {
          const cached = localStorage.getItem("user")
          if (cached) {
            try { current = JSON.parse(cached) } catch {}
          }
        }
        if (current) setUser(current)
        // Ya podemos dejar de mostrar loading si había cache
        setIsLoading(false)

        // Refrescar perfil
        try {
          const fresh = await getCurrentUser()
          current = fresh || current
          globalUser = current
          setUser(current)
          if (typeof window !== "undefined" && current) {
            localStorage.setItem("user", JSON.stringify(current))
            window.dispatchEvent(new CustomEvent("auth:user", { detail: current }))
          }
        } catch (_) {}

        // Bloquear cliente, bloqueado o eliminado
        if (current?.rol === "cliente" || (current as any)?.bloqueado === true || (current as any)?.deleted_at) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          globalUser = null
          router.replace("/login")
          return
        }

        if (allowedRoles && current && !allowedRoles.includes((current as any).rol as any)) {
          router.replace("/unauthorized")
          return
        }
      } catch (error) {
        console.error("Auth init error:", error)
        if (typeof window !== "undefined") {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          window.dispatchEvent(new CustomEvent("auth:user", { detail: null }))
        }
        globalUser = null
        router.replace("/login")
        return
      } finally {
        isInitialized = true
        // Asegurar que loading esté desactivado tras la primera inicialización
        setIsLoading(false)
      }
    }

    // Ejecutar init en cada navegación a rutas protegidas
    void init()
  }, [router, allowedRoles, pathname])

  if (isLoading || (!user && !(pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password"))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // En rutas públicas simplemente renderizar children

  return <>{children}</>
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (globalUser) return globalUser
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("user")
      if (raw) {
        try {
          return JSON.parse(raw)
        } catch {}
      }
    }
    return null
  })
  const router = useRouter()

  useEffect(() => {
    // Load from localStorage in case of refresh
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        globalUser = parsedUser
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    // Subscribe to auth user change events
    const handler = (e: Event) => {
      const ce = e as CustomEvent
      const nextUser = ce.detail ?? null
      if (nextUser) {
        globalUser = nextUser
        setUser(nextUser)
      } else {
        globalUser = null
        setUser(null)
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("auth:user", handler as EventListener)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth:user", handler as EventListener)
      }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    globalUser = null
    isInitialized = false
    setUser(null)
    router.replace("/login")
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:user", { detail: null }))
    }
  }, [router])

  return { user, logout }
}
