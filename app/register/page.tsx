"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { register as registerApi } from "@/lib/auth"
import { lettersOnly, digitsOnly, isValidName, isValidPhone, isValidEmail } from "@/lib/validators"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    rol: "cliente",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Sanitizar según campo
    if (name === 'nombre' || name === 'apellido') {
      setFormData((prev) => ({ ...prev, [name]: lettersOnly(value) }))
    } else if (name === 'telefono') {
      setFormData((prev) => ({ ...prev, [name]: digitsOnly(value) }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Validaciones derivadas (front)
  const validNombre = isValidName(formData.nombre)
  const validApellido = isValidName(formData.apellido)
  const validTelefono = formData.telefono === '' ? true : isValidPhone(formData.telefono)
  const validEmail = isValidEmail(formData.email)
  const canSubmit = validNombre && validApellido && validTelefono && validEmail && formData.password.length >= 6 && formData.password === formData.confirmPassword

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Validation
    if (!validNombre) {
      setError("Nombre inválido: solo letras y espacios, mínimo 2 caracteres")
      setIsLoading(false)
      return
    }
    if (!validApellido) {
      setError("Apellido inválido: solo letras y espacios, mínimo 2 caracteres")
      setIsLoading(false)
      return
    }
    if (!validEmail) {
      setError("Email inválido")
      setIsLoading(false)
      return
    }
    if (!validTelefono) {
      setError("Teléfono inválido: solo números (6 a 15 dígitos)")
      setIsLoading(false)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }
    try {
      const { confirmPassword, ...payload } = formData
      await registerApi(payload)
      setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.")
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Error al registrarse"
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
          <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
          <CardDescription>Regístrate para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
                {!validNombre && formData.nombre !== '' && (
                  <p className="text-xs text-red-600">Solo letras y espacios (mín. 2 caracteres).</p>
                )}
                <Input
                  id="apellido"
                  name="apellido"
                  type="text"
                  placeholder="Pérez"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  required
                />
                {!validApellido && formData.apellido !== '' && (
                  <p className="text-xs text-red-600">Solo letras y espacios (mín. 2 caracteres).</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {!validEmail && formData.email !== '' && (
                <p className="text-xs text-red-600">Ingrese un email válido.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.telefono}
                onChange={handleInputChange}
                required
              />
              {!validTelefono && formData.telefono !== '' && (
                <p className="text-xs text-red-600">Ingrese solo números (6 a 15 dígitos).</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !canSubmit}>
              {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
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

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Las cuentas creadas aquí se registran automáticamente como empleados. Para obtener
              permisos de administrador, contacta al administrador del sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
