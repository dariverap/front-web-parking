'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, Banknote, QrCode } from 'lucide-react'
import api from '@/lib/api'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  ocupacion: {
    id_ocupacion: number
    placa?: string
    marca?: string
    modelo?: string
    numero_espacio?: string
    hora_entrada?: string
    monto_calculado?: number
    tiempo_total?: number
  }
  onSuccess: () => void
}

interface MetodoPago {
  id_metodo: number
  nombre: string
}

export default function PaymentModal({
  isOpen,
  onClose,
  ocupacion,
  onSuccess,
}: PaymentModalProps) {
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [selectedMetodo, setSelectedMetodo] = useState<string>('')
  const [tipoComprobante, setTipoComprobante] = useState<'boleta' | 'factura'>('boleta')
  const [montoRecibido, setMontoRecibido] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingMetodos, setLoadingMetodos] = useState(true)
  const [loadingMonto, setLoadingMonto] = useState(true)
  const [montoCalculado, setMontoCalculado] = useState<number>(0)
  const [tiempoCalculado, setTiempoCalculado] = useState<number>(0)
  const [tarifaTipo, setTarifaTipo] = useState<string | undefined>(undefined)

  // Calcular monto desde el backend
  useEffect(() => {
    if (isOpen && ocupacion.id_ocupacion) {
      const calcularMonto = async () => {
        try {
          setLoadingMonto(true)
          console.log('[PaymentModal] Calculando monto para ocupación:', ocupacion.id_ocupacion)
          const response = await api.get(`/ocupaciones/${ocupacion.id_ocupacion}/calcular-monto`)
          console.log('[PaymentModal] Response calcular monto:', response.data)
          
          if (response.data.success) {
            const monto = response.data.data.monto || 0
            const tiempo = response.data.data.tiempo_minutos || 0
            const tipo = response.data.data.tarifa_tipo as string | undefined
            console.log('[PaymentModal] Monto calculado:', monto, 'Tiempo:', tiempo)
            setMontoCalculado(monto)
            setTiempoCalculado(tiempo)
            setTarifaTipo(tipo)
          }
        } catch (error: any) {
          console.error('[PaymentModal] Error al calcular monto:', error)
          console.error('[PaymentModal] Error response:', error.response?.data)
          // Fallback: calcular localmente
          const entrada = new Date(ocupacion.hora_entrada!)
          const ahora = new Date()
          const minutos = Math.max(1, Math.floor((ahora.getTime() - entrada.getTime()) / 60000))
          const horas = Math.ceil(minutos / 60)
          const monto = horas * 4.0 // tarifa por defecto
          console.log('[PaymentModal] Fallback - Minutos:', minutos, 'Horas:', horas, 'Monto:', monto)
          setTiempoCalculado(minutos)
          setMontoCalculado(monto)
          setTarifaTipo(undefined)
        } finally {
          setLoadingMonto(false)
        }
      }
      
      calcularMonto()
      // Actualizar cada minuto
      const interval = setInterval(calcularMonto, 60000)
      
      return () => clearInterval(interval)
    }
  }, [isOpen, ocupacion.id_ocupacion, ocupacion.hora_entrada])

  // Calcular datos de la ocupación
  const tiempoMinutos = tiempoCalculado || ocupacion.tiempo_total || 0
  const tiempoHoras = Math.floor(tiempoMinutos / 60)
  const tiempoMin = tiempoMinutos % 60
  const montoTotal = montoCalculado || ocupacion.monto_calculado || 0
  const montoRecibidoNum = parseFloat(montoRecibido) || 0
  const vuelto = montoRecibidoNum > montoTotal ? montoRecibidoNum - montoTotal : 0

  // Verificar si es efectivo
  const metodoSeleccionado = metodosPago.find(m => m.id_metodo.toString() === selectedMetodo)
  const esEfectivo = metodoSeleccionado?.nombre.toLowerCase().includes('efectivo')

  // Cargar métodos de pago
  useEffect(() => {
    const fetchMetodos = async () => {
      try {
        setLoadingMetodos(true)
        const response = await api.get('/metodos-pago')
        console.log('[PaymentModal] Response métodos:', response.data)
        
        // Manejar diferentes formatos de respuesta
        let metodos: MetodoPago[] = []
        if (response.data.success && response.data.data) {
          metodos = response.data.data
        } else if (Array.isArray(response.data)) {
          metodos = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          metodos = response.data.data
        }
        
        setMetodosPago(metodos)
        console.log('[PaymentModal] Métodos cargados:', metodos.length)
      } catch (error) {
        console.error('Error al cargar métodos de pago:', error)
      } finally {
        setLoadingMetodos(false)
      }
    }

    if (isOpen) {
      fetchMetodos()
    }
  }, [isOpen])

  // Reset form cuando se abre
  useEffect(() => {
    if (isOpen) {
      setSelectedMetodo('')
      setMontoRecibido('')
      setTipoComprobante('boleta')
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!selectedMetodo) {
      alert('Por favor selecciona un método de pago')
      return
    }

    if (esEfectivo && !montoRecibido) {
      alert('Por favor ingresa el monto recibido')
      return
    }

    if (esEfectivo && montoRecibidoNum < montoTotal) {
      alert('El monto recibido no puede ser menor al monto total')
      return
    }

    try {
      setLoading(true)
      
      const payload: {
        id_ocupacion: number
        id_metodo: number
        tipo_comprobante: string
        monto_recibido?: number
      } = {
        id_ocupacion: ocupacion.id_ocupacion,
        id_metodo: parseInt(selectedMetodo),
        tipo_comprobante: tipoComprobante,
      }

      if (esEfectivo) {
        payload.monto_recibido = montoRecibidoNum
      }

      const response = await api.post('/ocupaciones/marcar-salida-con-pago', payload)

      if (response.data.success) {
        onSuccess()
        onClose()
      }
    } catch (error: any) {
      console.error('Error al procesar pago:', error)
      alert(error.response?.data?.message || 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Marcar salida y cobrar</DialogTitle>
          <DialogDescription>
            Registra la salida del vehículo y procesa el pago en un solo paso
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Información del vehículo */}
          <div className="grid gap-2 rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {ocupacion.marca} {ocupacion.modelo}
                </p>
                <p className="text-sm text-muted-foreground">
                  Placa: {ocupacion.placa}
                </p>
              </div>
              <Badge variant="outline">Espacio {ocupacion.numero_espacio}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Tiempo total</p>
                {loadingMonto ? (
                  <p className="text-sm">Calculando...</p>
                ) : (
                  <p className="text-sm font-semibold">
                    {tiempoHoras}h {tiempoMin}min
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monto a cobrar</p>
                {loadingMonto ? (
                  <p className="text-lg">Calculando...</p>
                ) : (
                  <p className="text-lg font-bold text-primary">
                    S/ {montoTotal.toFixed(2)}
                  </p>
                )}
                {!loadingMonto && tarifaTipo && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Tarifa aplicada: <span className="font-medium">{tarifaTipo.charAt(0).toUpperCase() + tarifaTipo.slice(1)}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div className="grid gap-2">
            <Label htmlFor="metodo">Método de pago *</Label>
            {loadingMetodos ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select value={selectedMetodo} onValueChange={setSelectedMetodo}>
                <SelectTrigger id="metodo">
                  <SelectValue placeholder="Selecciona método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {metodosPago.map((metodo) => (
                    <SelectItem
                      key={metodo.id_metodo}
                      value={metodo.id_metodo.toString()}
                    >
                      <div className="flex items-center gap-2">
                        {metodo.nombre.toLowerCase().includes('efectivo') && (
                          <Banknote className="h-4 w-4" />
                        )}
                        {metodo.nombre.toLowerCase().includes('tarjeta') && (
                          <CreditCard className="h-4 w-4" />
                        )}
                        {(metodo.nombre.toLowerCase().includes('qr') ||
                          metodo.nombre.toLowerCase().includes('yape')) && (
                          <QrCode className="h-4 w-4" />
                        )}
                        {metodo.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Monto recibido (solo si es efectivo) */}
          {esEfectivo && (
            <div className="grid gap-2">
              <Label htmlFor="monto-recibido">Monto recibido *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  S/
                </span>
                <Input
                  id="monto-recibido"
                  type="number"
                  step="0.01"
                  min={montoTotal}
                  placeholder="0.00"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {vuelto > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Vuelto
                  </span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-400">
                    S/ {vuelto.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tipo de comprobante */}
          <div className="grid gap-2">
            <Label htmlFor="comprobante">Tipo de comprobante</Label>
            <Select value={tipoComprobante} onValueChange={(v) => setTipoComprobante(v as 'boleta' | 'factura')}>
              <SelectTrigger id="comprobante">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boleta">Boleta</SelectItem>
                <SelectItem value="factura">Factura</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedMetodo || (esEfectivo && !montoRecibido)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalizar y cobrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
