"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, DollarSign } from "lucide-react"

interface ParkingFormData {
  name: string
  address: string
  totalSpaces: string
  hourlyRate: string
  adminName: string
  phone: string
  openingHours: string
  description: string
  features: string[]
}

interface ParkingFormProps {
  initialData?: Partial<ParkingFormData>
  onSubmit: (data: ParkingFormData) => void
  onCancel: () => void
  isEditing?: boolean
}

const availableFeatures = [
  "Cámaras de Seguridad",
  "Acceso 24/7",
  "Plazas para Discapacitados",
  "Carga Eléctrica",
  "Techado",
  "Vigilancia",
  "Lavado de Coches",
  "WiFi Gratuito",
]

export function ParkingForm({ initialData = {}, onSubmit, onCancel, isEditing = false }: ParkingFormProps) {
  const [formData, setFormData] = useState<ParkingFormData>({
    name: initialData.name || "",
    address: initialData.address || "",
    totalSpaces: initialData.totalSpaces || "",
    hourlyRate: initialData.hourlyRate || "",
    adminName: initialData.adminName || "",
    phone: initialData.phone || "",
    openingHours: initialData.openingHours || "24 horas",
    description: initialData.description || "",
    features: initialData.features || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const toggleFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.includes(feature)
        ? formData.features.filter((f) => f !== feature)
        : [...formData.features, feature],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Parking *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Parking Centro Comercial"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">Administrador *</Label>
              <Input
                id="adminName"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="Nombre del administrador"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección Completa *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dirección completa del estacionamiento"
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción adicional del parking"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configuración Operativa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="totalSpaces">Plazas Totales *</Label>
              <Input
                id="totalSpaces"
                type="number"
                min="1"
                value={formData.totalSpaces}
                onChange={(e) => setFormData({ ...formData, totalSpaces: e.target.value })}
                placeholder="150"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Tarifa por Hora (S/. ) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.1"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="2.50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+34 91 123 4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingHours">Horario de Funcionamiento</Label>
            <Select
              value={formData.openingHours}
              onValueChange={(value) => setFormData({ ...formData, openingHours: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24 horas">24 horas</SelectItem>
                <SelectItem value="06:00 - 24:00">06:00 - 24:00</SelectItem>
                <SelectItem value="07:00 - 23:00">07:00 - 23:00</SelectItem>
                <SelectItem value="08:00 - 22:00">08:00 - 22:00</SelectItem>
                <SelectItem value="Personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características y Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Selecciona las características disponibles:</Label>
            <div className="flex flex-wrap gap-2">
              {availableFeatures.map((feature) => (
                <Badge
                  key={feature}
                  variant={formData.features.includes(feature) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleFeature(feature)}
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className={isEditing ? "" : "bg-green-600 hover:bg-green-700"}>
          {isEditing ? "Guardar Cambios" : "Crear Parking"}
        </Button>
      </div>
    </form>
  )
}
