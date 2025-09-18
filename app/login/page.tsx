"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Eye, EyeOff } from "lucide-react"
import { login as loginApi } from "@/lib/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { user } = await loginApi({ email, password })

      // Redirección básica: al Home. Si más adelante se quiere por rol, se puede ajustar aquí
      if (user && (user.rol === "admin_general" || user.rol === "admin_parking" || user.rol === "empleado")) {
        router.replace("/")
      } else if (user && user.rol === "cliente") {
        setError("Tu rol (cliente) no tiene acceso a la web. Usa la app móvil.")
      } else {
        router.replace("/")
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || "Error al iniciar sesión"
      setError(message)
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
          <CardTitle className="text-2xl font-bold">ParkManager</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Button variant="link" className="p-0 h-auto font-normal" asChild>
                <Link href="/register">Regístrate aquí</Link>
              </Button>
            </p>
            <p className="text-sm text-muted-foreground">
              ¿Olvidaste tu contraseña?{" "}
              <Button variant="link" className="p-0 h-auto font-normal" asChild>
                <Link href="/forgot-password">Recuperar contraseña</Link>
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

