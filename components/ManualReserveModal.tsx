"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, UserPlus, Loader2 } from "lucide-react"
import api from "@/lib/api"
import SuccessAnimation from "@/components/SuccessAnimation"

interface Espacio {
  id_espacio: number | string
  numero_espacio: string
  estado: string
}

interface Tarifa {
  id_tarifa: number
  tipo: string
  monto: number
}

interface ManualReserveModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  parkingId: string
  espaciosDisponibles: Espacio[]
}

export default function ManualReserveModal({
  isOpen,
  onClose,
  onSuccess,
  parkingId,
  espaciosDisponibles
}: ManualReserveModalProps) {
  const [loading, setLoading] = useState(false)
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [formData, setFormData] = useState({
    guest_nombre: "",
    guest_documento: "",
    guest_telefono: "",
    guest_vehiculo_placa: "",
    guest_vehiculo_marca: "",
    guest_vehiculo_modelo: "",
    guest_vehiculo_color: "",
    id_espacio: "",
    id_tarifa: "",
    marcar_entrada: true // Por defecto crear ocupación inmediata
  })

  useEffect(() => {
    if (isOpen && parkingId) {
      loadTarifas()
    }
  }, [isOpen, parkingId])

  const loadTarifas = async () => {
    try {
      const response = await api.get(`/parkings/${parkingId}/tarifas`)
      console.log('[ManualReserveModal] Tarifas response:', response.data)
      if (response.data?.success && response.data.data) {
        setTarifas(response.data.data)
        console.log('[ManualReserveModal] Tarifas cargadas:', response.data.data.length)
        // Auto-seleccionar tarifa 'hora' si existe
        const tarifaHora = response.data.data.find((t: Tarifa) => 
          t.tipo.toLowerCase() === 'hora'
        )
        if (tarifaHora) {
          console.log('[ManualReserveModal] Auto-seleccionando tarifa hora:', tarifaHora.id_tarifa)
          setFormData(prev => ({ ...prev, id_tarifa: String(tarifaHora.id_tarifa) }))
        }
      }
    } catch (error) {
      console.error('[ManualReserveModal] Error cargando tarifas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.guest_nombre.trim()) {
      alert('El nombre del visitante es requerido')
      return
    }

    if (!formData.id_espacio) {
      alert('Selecciona un espacio')
      return
    }

    try {
      setLoading(true)
      
      const payload = {
        id_parking: parseInt(parkingId),
        id_espacio: parseInt(formData.id_espacio),
        id_tarifa: formData.id_tarifa ? parseInt(formData.id_tarifa) : undefined,
        guest_nombre: formData.guest_nombre.trim(),
        guest_documento: formData.guest_documento.trim() || undefined,
        guest_telefono: formData.guest_telefono.trim() || undefined,
        guest_vehiculo_placa: formData.guest_vehiculo_placa.trim() || undefined,
        guest_vehiculo_marca: formData.guest_vehiculo_marca.trim() || undefined,
        guest_vehiculo_modelo: formData.guest_vehiculo_modelo.trim() || undefined,
        guest_vehiculo_color: formData.guest_vehiculo_color.trim() || undefined,
        marcar_entrada: formData.marcar_entrada
      }

      const response = await api.post('/reservas/manual', payload)
      
      console.log('[ManualReserveModal] Response:', response?.data)
      
      if (response.data?.success) {
        const message = formData.marcar_entrada 
          ? `Reserva creada y entrada registrada para ${formData.guest_nombre}`
          : `Reserva manual creada para ${formData.guest_nombre}`
        
        setSuccessMessage(message)
        setShowSuccess(true)
        resetForm()
        onSuccess()
        // onClose() se llamará cuando cierre el SuccessAnimation
      } else {
        alert('La reserva no se completó correctamente')
      }
    } catch (error: any) {
      console.error('[ManualReserveModal] Error completo:', error)
      if (error.response) {
        console.error('[ManualReserveModal] Error response:', error.response.data)
      }
      const errorMsg = error.response?.data?.message || error.message || 'Error al crear la reserva manual'
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      guest_nombre: "",
      guest_documento: "",
      guest_telefono: "",
      guest_vehiculo_placa: "",
      guest_vehiculo_marca: "",
      guest_vehiculo_modelo: "",
      guest_vehiculo_color: "",
      id_espacio: "",
      id_tarifa: "",
      marcar_entrada: true
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <>
      {!showSuccess && (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              <DialogTitle>Reserva Manual</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Registra una reserva para un visitante sin cuenta en la app
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre del visitante */}
          <div className="space-y-2">
            <Label htmlFor="guest_nombre">
              Nombre del visitante <span className="text-red-500">*</span>
            </Label>
            <Input
              id="guest_nombre"
              placeholder="Ej: Juan Pérez"
              value={formData.guest_nombre}
              onChange={(e) => setFormData({ ...formData, guest_nombre: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Documento */}
          <div className="space-y-2">
            <Label htmlFor="guest_documento">DNI / CE (opcional)</Label>
            <Input
              id="guest_documento"
              placeholder="Ej: 12345678"
              value={formData.guest_documento}
              onChange={(e) => setFormData({ ...formData, guest_documento: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="guest_telefono">Teléfono (opcional)</Label>
            <Input
              id="guest_telefono"
              placeholder="Ej: 987654321"
              value={formData.guest_telefono}
              onChange={(e) => setFormData({ ...formData, guest_telefono: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Separador de vehículo */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">Datos del Vehículo (opcional)</p>
            
            {/* Placa del vehículo */}
            <div className="space-y-2 mb-3">
              <Label htmlFor="guest_vehiculo_placa">Placa</Label>
              <Input
                id="guest_vehiculo_placa"
                placeholder="Ej: ABC-123"
                value={formData.guest_vehiculo_placa}
                onChange={(e) => setFormData({ ...formData, guest_vehiculo_placa: e.target.value.toUpperCase() })}
                disabled={loading}
                maxLength={10}
              />
            </div>

            {/* Marca y Modelo en grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-2">
                <Label htmlFor="guest_vehiculo_marca">Marca</Label>
                <Input
                  id="guest_vehiculo_marca"
                  placeholder="Ej: Toyota"
                  value={formData.guest_vehiculo_marca}
                  onChange={(e) => setFormData({ ...formData, guest_vehiculo_marca: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest_vehiculo_modelo">Modelo</Label>
                <Input
                  id="guest_vehiculo_modelo"
                  placeholder="Ej: Corolla"
                  value={formData.guest_vehiculo_modelo}
                  onChange={(e) => setFormData({ ...formData, guest_vehiculo_modelo: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="guest_vehiculo_color">Color</Label>
              <Input
                id="guest_vehiculo_color"
                placeholder="Ej: Rojo"
                value={formData.guest_vehiculo_color}
                onChange={(e) => setFormData({ ...formData, guest_vehiculo_color: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Espacio */}
          <div className="space-y-2">
            <Label htmlFor="id_espacio">
              Espacio <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.id_espacio}
              onValueChange={(value) => {
                // Normalizar a string para que el Select muestre siempre el valor
                setFormData({ ...formData, id_espacio: value })
              }}
              disabled={loading || espaciosDisponibles.length === 0}
            >
              <SelectTrigger id="id_espacio">
                <SelectValue placeholder={
                  espaciosDisponibles.length === 0 
                    ? "No hay espacios disponibles" 
                    : "Selecciona un espacio"
                } />
              </SelectTrigger>
              <SelectContent>
                {espaciosDisponibles.map((esp) => {
                  const value = String(esp.id_espacio)
                  return (
                    <SelectItem key={value} value={value}>
                      Espacio {esp.numero_espacio}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Tarifa */}
          <div className="space-y-2">
            <Label htmlFor="id_tarifa">Tarifa</Label>
            <Select
              value={formData.id_tarifa}
              onValueChange={(value) => setFormData({ ...formData, id_tarifa: value })}
              disabled={loading || tarifas.length === 0}
            >
              <SelectTrigger id="id_tarifa">
                <SelectValue placeholder="Selecciona una tarifa (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {tarifas.map((tarifa) => (
                  <SelectItem key={tarifa.id_tarifa} value={String(tarifa.id_tarifa)}>
                    {tarifa.tipo} - S/ {tarifa.monto.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Marcar entrada inmediata */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="marcar_entrada"
              checked={formData.marcar_entrada}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, marcar_entrada: checked as boolean })
              }
              disabled={loading}
            />
            <Label
              htmlFor="marcar_entrada"
              className="text-sm font-normal cursor-pointer"
            >
              Marcar entrada inmediata (crear ocupación activa)
            </Label>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || espaciosDisponibles.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                formData.marcar_entrada ? "Crear y Marcar Entrada" : "Crear Reserva"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
      )}
      {/* Success Animation fuera del Dialog para evitar z-index issues */}
      <SuccessAnimation
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          onClose()
        }}
        title="¡Reserva Creada!"
        message={successMessage}
        useAnimation={true}
        animationSrc="/animations/car.gif"
        duration={0} // Desactiva auto-cierre para que solo se cierre con el botón "Entendido"
      />
    </>
  )
}
