"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, ArrowLeft, Lock } from "lucide-react"

import { resetPassword as resetPasswordApi } from "@/lib/auth"

function getHashParams(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.substring(1)
    : window.location.hash
  const params = new URLSearchParams(hash)
  const result: Record<string, string> = {}
  params.forEach((v, k) => {
    result[k] = v
  })
  return result
}

function getQueryParams(): URLSearchParams | null {
  if (typeof window === "undefined") return null
  return new URL(window.location.href).searchParams
}

export default function ResetPasswordPage() {
  const router = useRouter()

  const [accessToken, setAccessToken] = useState<string>("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Intentar obtener access_token desde el hash
    const hashParams = getHashParams()
    const hashAccessToken = hashParams["access_token"]

    // Intentar obtener desde query string
    const qs = getQueryParams()
    const queryAccessToken = qs?.get("access_token") || undefined
    const code = qs?.get("code") || undefined

    if (hashAccessToken) {
      setAccessToken(hashAccessToken)
      return
    }

    if (queryAccessToken) {
      // Pocos casos, pero lo soportamos si llega así
      setAccessToken(queryAccessToken)
      return
    }

    if (code) {
      // Nuestro backend espera un JWT access_token, no un "code" de OTP.
      // Mostramos una instrucción clara al usuario/admin.
      setError(
        "El enlace contiene un parámetro 'code', pero esta aplicación espera 'access_token' en la URL. Verifica en Supabase que el enlace de recuperación use el formato con '#access_token=...'."
      )
      return
    }

    // Si no hay token alguno
    setError(
      "No se encontró un token de recuperación en la URL. Asegúrate de abrir el enlace desde el correo más reciente o solicita uno nuevo."
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!accessToken) {
      setError("No hay access_token válido en la URL.")
      return
    }

    if (!password || password.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    try {
      setIsLoading(true)
      await resetPasswordApi({ access_token: accessToken, newPassword: password })
      setSuccess("Tu contraseña ha sido restablecida correctamente. Redirigiendo al login...")
      // Pequeño delay y redirigir a login
      setTimeout(() => router.push("/login"), 1500)
    } catch (err: any) {
      const msg = err?.response?.data?.message || "No se pudo restablecer la contraseña"
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Restablecer contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Nota: evitamos mostrar la URL completa para prevenir errores de hidratación y exposición de tokens. */}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !accessToken}>
              {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button variant="link" className="p-0 h-auto font-normal" asChild>
              <Link href="/login" className="flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
