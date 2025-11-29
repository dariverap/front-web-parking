"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardList, Car, ParkingCircle, DollarSign, Percent, Clock, Plus, Edit, Trash2, RefreshCcw, Lock, Unlock, CheckCircle2, AlertCircle, X, LogOut, Eye, Banknote, Smartphone, CreditCard, Download } from "lucide-react"
import { listTarifasByParking, createTarifa, updateTarifa, deleteTarifa, type TarifaRecord } from "@/lib/tarifas"
import { listSpacesByParking, toggleSpaceEnabled, type SpaceRecord } from "@/lib/spaces"
import { listReservasByParking, listOcupacionesActivas, listHistorialOcupaciones, confirmarEntrada, registrarSalida, type ReservaRecord, type OcupacionRecord } from "@/lib/reservas"
import { listPagosPendientesByParking, listAllPagos, validarPago, type PagoPendiente, type PagoRecord } from "@/lib/pagos"
import { listOperationsForParking, buildTimeline, type OperationRecord } from "@/lib/operations"
import PaymentModal from "@/components/PaymentModal"
import ManualReserveModal from "@/components/ManualReserveModal"
import EmptyState from "@/components/EmptyState"
import LoadingSpinner from "@/components/LoadingSpinner"
import { useToast } from "@/hooks/use-toast"

export default function ParkingManagementPage() {
  const params = useParams()
  const parkingId = params?.id as string | undefined
  const { toast } = useToast()
  
  console.log('[ParkingManagementPage] Component loaded with parkingId:', parkingId, 'params:', params)

  // ========== TARIFAS STATE ==========
  const [tarifas, setTarifas] = useState<TarifaRecord[]>([])
  const [tLoading, setTLoading] = useState(false)
  const [isTarifaDialogOpen, setIsTarifaDialogOpen] = useState(false)
  const [editingTarifa, setEditingTarifa] = useState<TarifaRecord | null>(null)
  const [tarifaForm, setTarifaForm] = useState<{tipo: string, monto: string, condiciones: string}>({
    tipo: "hora",
    monto: "",
    condiciones: ""
  })
  const [tarifaError, setTarifaError] = useState("")
  const [isSubmittingTarifa, setIsSubmittingTarifa] = useState(false)
  
  // Catálogo de tipos permitidos (canónicos en minúsculas)
  const allowedTarifaTypes = useMemo(() => (
    ['hora','medio dia','dia','semana','mes'] as const
  ), [])

  const displayTipo = useCallback((tipo: string) => {
    const t = (tipo || '').toLowerCase()
    if (t === 'hora') return 'Hora'
    if (t === 'medio dia') return 'Medio día'
    if (t === 'dia') return 'Día'
    if (t === 'semana') return 'Semana'
    if (t === 'mes') return 'Mes'
    return tipo || '—'
  }, [])

  // ========== ESPACIOS STATE ==========
  const [spaces, setSpaces] = useState<SpaceRecord[]>([])
  const [sLoading, setSLoading] = useState(false)
  const [spaceQuery, setSpaceQuery] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [spaceError, setSpaceError] = useState("")

  // Pagination & filter
  const filteredSpaces = useMemo(() => {
    const q = spaceQuery.toLowerCase().trim()
    const arr = q ? spaces.filter(s => (s.numero_espacio || "").toLowerCase().includes(q)) : spaces
    return arr
  }, [spaces, spaceQuery])

  const totalPages = Math.max(1, Math.ceil(filteredSpaces.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pagedSpaces = filteredSpaces.slice(start, end)

  // ========== RESERVAS STATE ==========
  const [reservas, setReservas] = useState<ReservaRecord[]>([])
  const [ocupaciones, setOcupaciones] = useState<OcupacionRecord[]>([])
  const [rLoading, setRLoading] = useState(false)
  const [reservaError, setReservaError] = useState("")
  const [confirmandoEntrada, setConfirmandoEntrada] = useState<string | null>(null)
  const [registrandoSalida, setRegistrandoSalida] = useState<string | null>(null)

  // ========== PAGOS STATE ==========
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([])
  const [pagosHoy, setPagosHoy] = useState<PagoRecord[]>([])
  const [historialOcupaciones, setHistorialOcupaciones] = useState<OcupacionRecord[]>([])
  const [pLoading, setPLoading] = useState(false)
  const [pagoError, setPagoError] = useState("")
  const [validandoPago, setValidandoPago] = useState<string | null>(null)

  // ========== HISTORIAL UNIFICADO ==========
  const [ops, setOps] = useState<OperationRecord[]>([])
  const [opsLoading, setOpsLoading] = useState(false)
  const [opsError, setOpsError] = useState<string>("")
  const [historialQuery, setHistorialQuery] = useState("")
  const [fechaDesde, setFechaDesde] = useState("") // yyyy-mm-dd
  const [fechaHasta, setFechaHasta] = useState("") // yyyy-mm-dd
  const [estadoFiltro, setEstadoFiltro] = useState<string>("")
  const [detalleOperacion, setDetalleOperacion] = useState<OperationRecord | null>(null)

  // ========== PAYMENT MODAL STATE ==========
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedOcupacion, setSelectedOcupacion] = useState<OcupacionRecord | null>(null)

  // ========== MANUAL RESERVE MODAL STATE ==========
  const [isManualReserveModalOpen, setIsManualReserveModalOpen] = useState(false)

  // ========== COMPROBANTES ==========
  const [descargandoComprobante, setDescargandoComprobante] = useState(false)

  // ========== STATISTICS ==========
  const [stats, setStats] = useState({
    reservasActivas: 0,
    vehiculosDentro: 0,
    espaciosDisponibles: 0,
    ingresosHoy: 0,
    ocupacion: 0,
    tiempoPromedio: "0h 0m"
  })

  // ========== TARIFAS HANDLERS ==========
  const reloadTarifas = useCallback(async () => {
    if (!parkingId) return
    setTLoading(true)
    setTarifaError("")
    try {
      const data = await listTarifasByParking(parkingId)
      setTarifas(data)
    } catch (err: any) {
      setTarifaError(err?.message || "Error al cargar tarifas")
    } finally {
      setTLoading(false)
    }
  }, [parkingId])

  const openCreateTarifa = () => {
    setEditingTarifa(null)
    setTarifaForm({ tipo: "hora", monto: "", condiciones: "" })
    setTarifaError("")
    setIsTarifaDialogOpen(true)
  }

  const openEditTarifa = (t: TarifaRecord) => {
    setEditingTarifa(t)
    setTarifaForm({
      tipo: t.tipo,
      monto: String(t.monto),
      condiciones: t.condiciones || ""
    })
    setTarifaError("")
    setIsTarifaDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsTarifaDialogOpen(false)
    setEditingTarifa(null)
    setTarifaError("")
    setIsSubmittingTarifa(false)
  }

  const submitTarifa = async () => {
    if (!parkingId) return
    const { tipo, monto, condiciones } = tarifaForm
    const tipoCanon = tipo.trim().toLowerCase()
    if (!tipoCanon) {
      setTarifaError("El tipo es requerido")
      return
    }
    if (!allowedTarifaTypes.includes(tipoCanon as any)) {
      setTarifaError("Tipo inválido. Usa: Hora, Medio día, Día, Semana o Mes")
      return
    }
    if (!monto.trim()) {
      setTarifaError("El monto es requerido")
      return
    }
    // Validar duplicados en cliente (ayuda rápida de UX; el backend también valida)
    const existsSameType = tarifas.some(t => (t.tipo || '').toLowerCase() === tipoCanon && (!editingTarifa || t.id_tarifa !== editingTarifa.id_tarifa))
    if (existsSameType) {
      setTarifaError("Ya existe una tarifa de ese tipo para este parking")
      return
    }
    setTarifaError("")
    setIsSubmittingTarifa(true)
    try {
      if (editingTarifa) {
        await updateTarifa(parkingId, editingTarifa.id_tarifa, {
          tipo: tipoCanon,
          monto: parseFloat(monto),
          condiciones: condiciones.trim() || null
        })
      } else {
        await createTarifa(parkingId, {
          tipo: tipoCanon,
          monto: parseFloat(monto),
          condiciones: condiciones.trim() || null
        })
      }
      await reloadTarifas()
      handleCloseDialog()
    } catch (err: any) {
      setTarifaError(err?.message || "Error al guardar tarifa")
    } finally {
      setIsSubmittingTarifa(false)
    }
  }

  const handleDeleteTarifa = async (t: TarifaRecord) => {
    if (!window.confirm("¿Eliminar esta tarifa?")) return
    setTarifaError("")
    try {
      await deleteTarifa(parkingId, t.id_tarifa)
      await reloadTarifas()
    } catch (err: any) {
      setTarifaError(err?.message || "Error al eliminar")
    }
  }

  // ========== ESPACIOS HANDLERS ==========
  const reloadSpaces = useCallback(async () => {
    if (!parkingId) return
    setSLoading(true)
    setSpaceError("")
    try {
      const data = await listSpacesByParking(parkingId)
      const sorted = data.sort((a, b) => {
        const aNum = a.numero_espacio || ""
        const bNum = b.numero_espacio || ""
        const aInt = parseInt(aNum, 10)
        const bInt = parseInt(bNum, 10)
        if (!isNaN(aInt) && !isNaN(bInt)) return aInt - bInt
        return aNum.localeCompare(bNum)
      })
      setSpaces(sorted)
    } catch (err: any) {
      setSpaceError(err?.message || "Error al cargar espacios")
    } finally {
      setSLoading(false)
    }
  }, [parkingId])

  const handleToggleEnabled = async (s: SpaceRecord) => {
    if (!parkingId) return
    if (s.estado === 'ocupado' || s.estado === 'reservado') return
    const nextEstado = (s.estado === 'deshabilitado' || s.estado === 'inhabilitado') ? 'disponible' : 'deshabilitado'
    setTogglingId(s.id_espacio)
    setSpaceError("")
    const oldSpaces = [...spaces]
    setSpaces(prev => prev.map(x => x.id_espacio === s.id_espacio ? { ...x, estado: nextEstado } : x))
    try {
      await toggleSpaceEnabled(parkingId, s.id_espacio)
      let confirmed = false
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 400))
        const fresh = await listSpacesByParking(parkingId)
        const target = fresh.find(x => x.id_espacio === s.id_espacio)
        if (target && target.estado === nextEstado) {
          confirmed = true
          setSpaces(fresh.sort((a, b) => {
            const aNum = a.numero_espacio || ""
            const bNum = b.numero_espacio || ""
            const aInt = parseInt(aNum, 10)
            const bInt = parseInt(bNum, 10)
            if (!isNaN(aInt) && !isNaN(bInt)) return aInt - bInt
            return aNum.localeCompare(bNum)
          }))
          break
        }
      }
      if (!confirmed) throw new Error("No se pudo confirmar el cambio")
    } catch (err: any) {
      setSpaces(oldSpaces)
      setSpaceError(err?.message || "Error al cambiar estado")
    } finally {
      setTogglingId(null)
    }
  }

  // ========== RESERVAS HANDLERS ==========
  const reloadReservas = useCallback(async () => {
    if (!parkingId) return
    setRLoading(true)
    setReservaError("")
    try {
      // Obtener reservas activas y pendientes
      const [reservasActivas, reservasPendientes, ocupacionesActivas] = await Promise.all([
        listReservasByParking(parkingId, "activa"),
        listReservasByParking(parkingId, "pendiente"),
        listOcupacionesActivas(parkingId)
      ])
      
      // Filtrar reservas activas que ya tienen ocupación para evitar duplicados
      const ocupacionesReservaIds = new Set(ocupacionesActivas.map(o => o.id_reserva).filter(Boolean))
      const reservasSinOcupacion = reservasActivas.filter(r => !ocupacionesReservaIds.has(r.id_reserva))
      
      setReservas([...reservasSinOcupacion, ...reservasPendientes])
      setOcupaciones(ocupacionesActivas)
    } catch (err: any) {
      setReservaError(err?.message || "Error al cargar reservas")
      console.error(err)
    } finally {
      setRLoading(false)
    }
  }, [parkingId])

  const handleConfirmarEntrada = async (idReserva: string) => {
    if (!window.confirm("¿Confirmar entrada del vehículo al parking?")) return
    setConfirmandoEntrada(idReserva)
    setReservaError("")
    try {
      await confirmarEntrada(idReserva)
      await reloadReservas()
      await reloadSpaces() // Actualizar estado de espacios
    } catch (err: any) {
      setReservaError(err?.message || "Error al confirmar entrada")
    } finally {
      setConfirmandoEntrada(null)
    }
  }

  const handleMarcarSalida = async (idOcupacion: string) => {
    // Buscar la ocupación completa
    const ocupacion = ocupaciones.find(o => o.id_ocupacion === idOcupacion)
    if (!ocupacion) {
      setReservaError("No se encontró la ocupación")
      return
    }
    
    // Abrir modal de pago
    setSelectedOcupacion(ocupacion)
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = async () => {
    // Mostrar mensaje de éxito
    toast({
      title: "✅ Pago procesado exitosamente",
      description: "El comprobante ha sido generado y enviado por email al cliente.",
      variant: "default",
    })
    
    // Recargar datos después de procesar el pago
    await Promise.all([
      reloadReservas(),
      reloadSpaces(),
      reloadPagos()
    ])
  }

  // ========== PAGOS HANDLERS ==========
  const reloadPagos = useCallback(async () => {
    if (!parkingId) return
    setPLoading(true)
    setPagoError("")
    console.log('[DEBUG] === INICIO reloadPagos ===', { parkingId })
    try {
      // Cargar pagos pendientes
      console.log('[DEBUG] Cargando pagos pendientes...')
      const pendientes = await listPagosPendientesByParking(parkingId)
      console.log('[DEBUG] Pagos pendientes cargados:', pendientes.length)
      setPagosPendientes(pendientes)
      
      // Cargar pagos completados del día actual para calcular ingresos
      console.log('[DEBUG] Cargando todos los pagos del parking...')
      // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
      const ahora = new Date()
      const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
      const todosLosPagos = await listAllPagos({ id_parking: parkingId })
      console.log('[DEBUG] Todos los pagos del parking:', todosLosPagos.length)
      console.log('[DEBUG] Fecha de hoy (LOCAL):', hoy)
      console.log('[DEBUG] Estructura del primer pago:', JSON.stringify(todosLosPagos[0], null, 2))
      
      const pagosDelDia = []
      
      for (const p of todosLosPagos) {
        try {
          // Normalizar estado
          const estadoNormalizado = (p.estado || '').toUpperCase()
          
          // Extraer fecha
          const fechaRaw = p.fecha_pago || p.emitido_en
          if (!fechaRaw) {
            console.warn('[DEBUG] Pago sin fecha:', p.id_pago)
            continue
          }
          
          // Usar FECHA LOCAL (no UTC) para comparar con 'hoy'
          const d = new Date(fechaRaw)
          const fechaPago = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          
          const esCompletado = estadoNormalizado === 'COMPLETADO'
          const esHoy = fechaPago === hoy
          
          console.log('[DEBUG] Pago #' + p.id_pago + ':', {
            estado: estadoNormalizado,
            fecha: fechaPago,
            hoy: hoy,
            esCompletado,
            esHoy,
            pasaFiltro: esCompletado && esHoy
          })
          
          if (esCompletado && esHoy) {
            pagosDelDia.push(p)
          }
        } catch (err) {
          console.error('[DEBUG] Error procesando pago:', p.id_pago, err)
        }
      }
      
      console.log('[DEBUG] Pagos completados hoy:', pagosDelDia.length, pagosDelDia)
      setPagosHoy(pagosDelDia)
      
      // Cargar historial de ocupaciones para calcular tiempo promedio
      const historial = await listHistorialOcupaciones(parkingId)
      console.log('[DEBUG] Historial de ocupaciones:', historial.length, historial.slice(0, 3))
      setHistorialOcupaciones(historial)
    } catch (err: any) {
      console.error('[DEBUG] ❌ ERROR en reloadPagos:', err)
      console.error('[DEBUG] Error stack:', err?.stack)
      setPagoError(err?.message || "Error al cargar datos de pagos")
    } finally {
      setPLoading(false)
    }
  }, [parkingId])

  const handleValidarPago = async (idPago: string) => {
    if (!window.confirm("¿Confirmar validación del pago? Se liberará el espacio.")) return
    setValidandoPago(idPago)
    setPagoError("")
    try {
      await validarPago(idPago)
      // Refrescar primero pagos para ocultar el botón, luego reservas/espacios
      await reloadPagos()
      await Promise.all([reloadReservas(), reloadSpaces()])
      alert("Pago validado exitosamente. El espacio ha sido liberado.")
    } catch (err: any) {
      setPagoError(err?.message || "Error al validar pago")
    } finally {
      setValidandoPago(null)
    }
  }

  // ========== HISTORIAL UNIFICADO HANDLERS ==========
  const reloadOperaciones = useCallback(async () => {
    if (!parkingId) return
    setOpsLoading(true)
    setOpsError("")
    try {
      const filters: any = {}
      if (estadoFiltro) filters.estado = estadoFiltro
      if (fechaDesde) filters.fecha_desde = fechaDesde
      if (fechaHasta) filters.fecha_hasta = fechaHasta
      if (historialQuery) filters.q = historialQuery

      const data = await listOperationsForParking(parkingId, filters)
      setOps(data)
    } catch (e: any) {
      setOpsError(e?.message || "Error al cargar historial de operaciones")
    } finally {
      setOpsLoading(false)
    }
  }, [parkingId, estadoFiltro, fechaDesde, fechaHasta, historialQuery])

  // ========== COMPROBANTES HANDLERS ==========
  const descargarComprobante = async (idPago: number) => {
    setDescargandoComprobante(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('No se encontró token de autenticación. Por favor inicia sesión nuevamente.')
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comprobantes/descargar/${idPago}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('Sesión expirada. Por favor inicia sesión nuevamente.')
          return
        }
        throw new Error('Error al descargar comprobante')
      }
      
      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'comprobante.pdf'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/)
        if (match) filename = match[1]
      }
      
      // Descargar el PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Error descargando comprobante:', error)
      alert('Error al descargar el comprobante. Por favor intente nuevamente.')
    } finally {
      setDescargandoComprobante(false)
    }
  }

  // Estados disponibles - lista completa fija de todos los estados posibles
  const estadosDisponibles = useMemo(() => {
    return [
      'pendiente',
      'confirmada',
      'activa',
      'finalizada',
      'finalizada_pagada',
      'cancelada',
      'expirada',
      'no_show'
    ]
  }, [])

  const colorByEstado = (s: string) => {
    const up = s.toLowerCase()
    if (up === "finalizada_pagada") return "bg-emerald-500/10 text-emerald-700 border-emerald-300"
    if (up === "finalizada") return "bg-violet-500/10 text-violet-700 border-violet-300"
    if (up === "activa") return "bg-blue-500/10 text-blue-700 border-blue-300"
    if (up === "pendiente") return "bg-amber-500/10 text-amber-700 border-amber-300"
    if (up === "confirmada") return "bg-cyan-500/10 text-cyan-700 border-cyan-300"
    if (up === "cancelada") return "bg-rose-500/10 text-rose-700 border-rose-300"
    if (up === "expirada") return "bg-slate-500/10 text-slate-700 border-slate-300"
    if (up === "no_show") return "bg-neutral-500/10 text-neutral-700 border-neutral-300"
    return "bg-secondary"
  }

  const labelByEstado = (s: string) => {
    const up = s.toLowerCase()
    if (up === "finalizada_pagada") return "Pagada"
    if (up === "finalizada") return "Finalizada"
    if (up === "activa") return "En curso"
    if (up === "pendiente") return "Pendiente"
    if (up === "confirmada") return "Confirmada"
    if (up === "cancelada") return "Cancelada"
    if (up === "expirada") return "Expirada"
    if (up === "no_show") return "No asistió"
    return s
  }

  const iconByMetodo = (metodo_tipo?: string | null) => {
    const tipo = (metodo_tipo || "").toLowerCase()
    if (tipo.includes("efectivo") || tipo === "efectivo") return <Banknote className="h-4 w-4" />
    if (tipo.includes("qr") || tipo === "qr") return <Smartphone className="h-4 w-4" />
    if (tipo.includes("tarjeta") || tipo === "tarjeta") return <CreditCard className="h-4 w-4" />
    return <Banknote className="h-4 w-4" />
  }

  // ========== CALCULATE STATISTICS ==========
  useEffect(() => {
    const disponibles = spaces.filter(s => s.estado === 'disponible').length
    const total = spaces.length
    const ocupados = spaces.filter(s => s.estado === 'ocupado').length
    const ocupacionPercent = total > 0 ? Math.round((ocupados / total) * 100) : 0
    
    // Calcular tiempo promedio desde el historial de ocupaciones (no las activas)
    let tiempoPromedio = "0h 0m"
    if (historialOcupaciones.length > 0) {
      // Filtrar ocupaciones que tienen tiempo_total válido (puede ser tiempo_total o tiempo_total_minutos)
      const ocupacionesConTiempo = historialOcupaciones.filter(o => {
        const tiempo = o.tiempo_total || o.tiempo_total_minutos || 0
        return tiempo > 0
      })
      
      console.log('[DEBUG] Ocupaciones con tiempo válido:', ocupacionesConTiempo.length)
      
      if (ocupacionesConTiempo.length > 0) {
        const totalMinutos = ocupacionesConTiempo.reduce((sum, o) => {
          const tiempo = o.tiempo_total || o.tiempo_total_minutos || 0
          return sum + tiempo
        }, 0)
        const promedioMinutos = Math.round(totalMinutos / ocupacionesConTiempo.length)
        const horas = Math.floor(promedioMinutos / 60)
        const minutos = promedioMinutos % 60
        tiempoPromedio = `${horas}h ${minutos}m`
        console.log('[DEBUG] Tiempo promedio calculado:', tiempoPromedio, 'de', totalMinutos, 'minutos totales')
      }
    }
    
    // Calcular ingresos del día desde pagos COMPLETADOS
    const ingresosHoy = pagosHoy.reduce((sum, pago) => sum + (pago.monto || 0), 0)
    console.log('[DEBUG] Ingresos hoy calculados:', ingresosHoy, 'de', pagosHoy.length, 'pagos')
    
    setStats({
      reservasActivas: reservas.length,
      vehiculosDentro: ocupaciones.length,
      espaciosDisponibles: disponibles,
      ingresosHoy,
      ocupacion: ocupacionPercent,
      tiempoPromedio
    })
  }, [spaces, reservas, ocupaciones, pagosHoy, historialOcupaciones])

  // ========== INITIAL LOAD ==========
  useEffect(() => {
    if (parkingId) {
      void reloadTarifas()
      void reloadSpaces()
      void reloadReservas()
      void reloadPagos()
      void reloadOperaciones()
    }
  }, [parkingId, reloadTarifas, reloadSpaces, reloadReservas, reloadPagos, reloadOperaciones])

  // Recargar operaciones cuando cambian filtros
  useEffect(() => {
    if (parkingId) {
      const reload = async () => {
        setOpsLoading(true)
        setOpsError("")
        try {
          const filters: any = {}
          if (estadoFiltro) filters.estado = estadoFiltro
          if (fechaDesde) filters.fecha_desde = fechaDesde
          if (fechaHasta) filters.fecha_hasta = fechaHasta
          if (historialQuery) filters.q = historialQuery

          const data = await listOperationsForParking(parkingId, filters)
          setOps(data)
        } catch (e: any) {
          setOpsError(e?.message || "Error al cargar historial de operaciones")
        } finally {
          setOpsLoading(false)
        }
      }
      void reload()
    }
  }, [parkingId, estadoFiltro, fechaDesde, fechaHasta, historialQuery])

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Mis Parkings", href: "/my-parkings" },
    { label: `Parking #${parkingId || ""}`, href: "#" }
  ]

  return (
    <AuthGuard allowedRoles={["admin_general", "admin_parking", "empleado"]}>
      <div className="p-6 pt-16 md:pt-6">
        <Breadcrumbs items={breadcrumbs} />
        
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Gestión de Parking</h1>
            <p className="text-muted-foreground mt-2">
              Administra reservas, tarifas y espacios
            </p>
          </div>

          {parkingId ? (
            <>
              {/* STATISTICS CARDS */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.reservasActivas}</div>
                    <p className="text-xs text-muted-foreground">Pendientes de confirmar</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vehículos Dentro</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.vehiculosDentro}</div>
                    <p className="text-xs text-muted-foreground">En el parking ahora</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Espacios Disponibles</CardTitle>
                    <ParkingCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.espaciosDisponibles}</div>
                    <p className="text-xs text-muted-foreground">De {spaces.length} totales</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">S/. {stats.ingresosHoy.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total del día</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.ocupacion}%</div>
                    <p className="text-xs text-muted-foreground">Porcentaje actual</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.tiempoPromedio}</div>
                    <p className="text-xs text-muted-foreground">Estadía media</p>
                  </CardContent>
                </Card>
              </div>

              {/* TABS */}
              <Tabs defaultValue="reservas" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] p-1">
                  <TabsTrigger 
                    value="reservas" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">Reservas</span>
                    <span className="sm:hidden">📋</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tarifas" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Tarifas</span>
                    <span className="sm:hidden">💰</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="espacios" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <ParkingCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Espacios</span>
                    <span className="sm:hidden">🅿️</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="historial" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">Historial</span>
                    <span className="sm:hidden">📜</span>
                  </TabsTrigger>
                </TabsList>

                {/* TAB: RESERVAS */}
                <TabsContent value="reservas" className="space-y-4 mt-0 min-h-[600px]">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Reservas Activas</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsManualReserveModalOpen(true)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-none"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Reserva Manual
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void reloadReservas()} disabled={rLoading}>
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {rLoading ? (
                        <LoadingSpinner message="Cargando reservas..." size="md" />
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Vehículo</TableHead>
                                <TableHead>Espacio</TableHead>
                                <TableHead>Hora Reserva</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reservas.map(r => {
                                const nombreUsuario = r.usuario 
                                  ? `${r.usuario.nombre} ${r.usuario.apellido}` 
                                  : (r.guest_nombre || "N/A")
                                // Priorizar vehículo registrado, luego guest_vehiculo_*
                                const placaVehiculo = r.vehiculo?.placa || r.guest_vehiculo_placa || "N/A"
                                const marcaVehiculo = r.vehiculo?.marca || r.guest_vehiculo_marca
                                const modeloVehiculo = r.vehiculo?.modelo || r.guest_vehiculo_modelo
                                const numeroEspacio = r.espacio?.numero_espacio || "N/A"
                                const horaReserva = new Date(r.hora_inicio).toLocaleString('es-PE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                const estaBusy = confirmandoEntrada === r.id_reserva

                                return (
                                  <TableRow key={r.id_reserva}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        <span>{nombreUsuario}</span>
                                        {!r.usuario && r.guest_nombre && (
                                          <Badge variant="outline" className="text-xs">Invitado</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{placaVehiculo}</span>
                                        {(marcaVehiculo || modeloVehiculo) && (
                                          <span className="text-xs text-muted-foreground">
                                            {marcaVehiculo} {modeloVehiculo}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">{numeroEspacio}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{horaReserva}</TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={r.estado === 'activa' ? 'default' : 'outline'}
                                        className={r.estado === 'activa' ? 'bg-blue-100 text-blue-800' : ''}
                                      >
                                        {r.estado}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button 
                                        size="sm" 
                                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                                        title="Confirmar entrada"
                                        disabled={estaBusy}
                                        onClick={() => void handleConfirmarEntrada(r.id_reserva)}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                        Confirmar Entrada
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                              {reservas.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="p-0">
                                    <EmptyState
                                      title="No hay reservas activas"
                                      description="Las nuevas reservas aparecerán aquí para confirmar entrada"
                                      useAnimation={true}
                                        animationSrc="/animations/empty-reservations.gif"
                                      action={
                                        <Button 
                                          variant="outline"
                                          onClick={() => setIsManualReserveModalOpen(true)}
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Crear Reserva Manual
                                        </Button>
                                      }
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      {reservaError && (
                        <div className="mt-3 text-sm text-red-600">{reservaError}</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Vehículos Dentro del Parking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Usuario</TableHead>
                              <TableHead>Vehículo</TableHead>
                              <TableHead>Hora Entrada</TableHead>
                              <TableHead>Espacio</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ocupaciones.map(o => {
                              const horaEntrada = new Date(o.hora_entrada).toLocaleString('es-PE', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                              const estaBusy = registrandoSalida === o.id_ocupacion
                              // Mostrar el botón siempre que NO exista una salida solicitada explícita
                              // Nota: monto_calculado/tiempo_total existen para ocupaciones activas y no deben ocultar el botón
                              const salidaSolicitada = !!o.hora_salida_solicitada
                              
                              // Priorizar datos de vehículo registrado, luego guest_vehiculo_*
                              const placaVehiculo = o.placa || o.guest_vehiculo_placa || "N/A"
                              const marcaVehiculo = o.marca || o.guest_vehiculo_marca
                              const modeloVehiculo = o.modelo || o.guest_vehiculo_modelo
                              
                              // Determinar si es invitado: no tiene id_usuario pero sí guest_nombre
                              const esInvitado = !o.id_usuario && !!o.guest_nombre
                              
                              // Nombre: priorizar guest_nombre para invitados, luego nombre_usuario
                              const nombreMostrar = o.guest_nombre || o.nombre_usuario || "Visitante"

                              return (
                                <TableRow key={o.id_ocupacion}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <span>{nombreMostrar}</span>
                                      {esInvitado && (
                                        <Badge variant="outline" className="text-xs">Invitado</Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{placaVehiculo}</span>
                                      {(marcaVehiculo || modeloVehiculo) && (
                                        <span className="text-xs text-muted-foreground">
                                          {marcaVehiculo} {modeloVehiculo}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">{horaEntrada}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{o.numero_espacio || "N/A"}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {!salidaSolicitada && (
                                      <Button 
                                        size="sm"
                                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
                                        disabled={estaBusy}
                                        onClick={() => void handleMarcarSalida(o.id_ocupacion)}
                                      >
                                        <LogOut className="h-4 w-4 mr-1.5" />
                                        {estaBusy ? 'Procesando...' : 'Marcar Salida'}
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                            {ocupaciones.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="p-0">
                                  <EmptyState
                                    title="No hay vehículos dentro"
                                    description="Los vehículos que ingresen aparecerán aquí"
                                    useAnimation={true}
                          animationSrc="/animations/empty-parking.gif"
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PAGOS PENDIENTES - COMENTADO (flujo simplificado ya no lo usa) */}
                  {/* 
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-amber-500" />
                        Pagos Pendientes de Validación
                      </CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => void reloadPagos()} disabled={pLoading}>
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {pLoading ? (
                        <p className="text-sm text-muted-foreground">Cargando pagos...</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Vehículo</TableHead>
                                <TableHead>Espacio</TableHead>
                                <TableHead>Tiempo</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Hora Salida Solicitada</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pagosPendientes.map(p => {
                                const horaSalida = p.hora_salida_solicitada 
                                  ? new Date(p.hora_salida_solicitada).toLocaleString('es-PE', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : "N/A"
                                const estaBusy = validandoPago === p.id_pago
                                const tiempoMinutos = p.tiempo_total_minutos || 0
                                const horas = Math.floor(tiempoMinutos / 60)
                                const minutos = tiempoMinutos % 60
                                const tiempoStr = `${horas}h ${minutos}m`
                                
                                // Priorizar datos de vehículo registrado, luego guest_vehiculo_*
                                const placaVehiculo = p.placa || p.vehiculo_placa || "N/A"
                                const marcaVehiculo = p.marca || p.vehiculo_marca
                                const modeloVehiculo = p.modelo || p.vehiculo_modelo

                                return (
                                  <TableRow key={p.id_pago}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        <span>{p.nombre_usuario || p.guest_nombre || "Visitante"}</span>
                                        {!p.id_usuario && p.guest_nombre && (
                                          <Badge variant="outline" className="text-xs">Invitado</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{placaVehiculo}</span>
                                        {(marcaVehiculo || modeloVehiculo) && (
                                          <span className="text-xs text-muted-foreground">
                                            {marcaVehiculo} {modeloVehiculo}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">{p.numero_espacio || "N/A"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                      {tiempoStr}
                                    </TableCell>
                                    <TableCell className="text-sm font-bold text-green-600">
                                      S/. {p.monto?.toFixed(2) || "0.00"}
                                    </TableCell>
                                    <TableCell className="text-sm">{horaSalida}</TableCell>
                                    <TableCell className="text-right">
                                      <Button 
                                        size="sm"
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
                                        disabled={estaBusy}
                                        onClick={() => void handleValidarPago(p.id_pago)}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                        {estaBusy ? 'Validando...' : 'Validar Pago'}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                              {pagosPendientes.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                                    No hay pagos pendientes de validación
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      {pagoError && (
                        <div className="mt-3 text-sm text-red-600">{pagoError}</div>
                      )}
                    </CardContent>
                  </Card>
                  */}
                </TabsContent>

                {/* TAB: TARIFAS */}
                <TabsContent value="tarifas" className="space-y-4 mt-0 min-h-[600px]">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Tarifas</CardTitle>
                      <Button onClick={openCreateTarifa} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Tarifa
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {tLoading ? (
                        <p className="text-sm text-muted-foreground">Cargando tarifas...</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Condiciones</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tarifas.map(t => (
                                <TableRow key={t.id_tarifa}>
                                  <TableCell className="font-medium">{displayTipo(t.tipo)}</TableCell>
                                  <TableCell>S/. {Number(t.monto).toFixed(2)}</TableCell>
                                  <TableCell className="max-w-md truncate">{t.condiciones || "—"}</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => openEditTarifa(t)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => void handleDeleteTarifa(t)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {tarifas.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Sin tarifas</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {tarifaError && (
                    <div className="mt-3 text-sm text-red-600">{tarifaError}</div>
                  )}
                </TabsContent>

                {/* TAB: ESPACIOS */}
                <TabsContent value="espacios" className="space-y-4 mt-0 min-h-[600px]">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Espacios</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="hidden md:block text-sm text-muted-foreground mr-2">
                          {filteredSpaces.length} espacios
                        </div>
                        <Badge variant="secondary">Parking #{parkingId || "—"}</Badge>
                        <div className="w-40">
                          <Input 
                            placeholder="Buscar..." 
                            value={spaceQuery} 
                            onChange={e => setSpaceQuery(e.target.value)} 
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => void reloadSpaces()} disabled={sLoading}>
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {sLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Cargando espacios...</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Vista Grid de Espacios */}
                          {filteredSpaces.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                              {pagedSpaces.map(s => {
                                const busy = togglingId === s.id_espacio
                                const blocked = s.estado === 'ocupado' || s.estado === 'reservado'
                                const isDisponible = s.estado === 'disponible'
                                const isOcupado = s.estado === 'ocupado'
                                const isReservado = s.estado === 'reservado'
                                const isInhabilitado = (s.estado === 'deshabilitado' || s.estado === 'inhabilitado')
                                
                                return (
                                  <Card 
                                    key={s.id_espacio} 
                                    className={`relative transition-all duration-200 hover:scale-105 ${
                                      isDisponible ? 'border-green-200 bg-green-50/50 hover:border-green-300 hover:shadow-md' : 
                                      isOcupado ? 'border-yellow-200 bg-yellow-50/50' : 
                                      isReservado ? 'border-blue-200 bg-blue-50/50' :
                                      'border-gray-200 bg-gray-50/50'
                                    } ${busy ? 'opacity-50' : ''}`}
                                  >
                                    <CardContent className="p-2">
                                      <div className="flex flex-col items-center gap-1.5">
                                        {/* Ícono del espacio - más pequeño */}
                                        <div className={`p-2 rounded-full ${
                                          isDisponible ? 'bg-green-100' : 
                                          isOcupado ? 'bg-yellow-100' : 
                                          isReservado ? 'bg-blue-100' :
                                          'bg-gray-100'
                                        }`}>
                                          {isDisponible && <ParkingCircle className="h-4 w-4 text-green-600" />}
                                          {isOcupado && <Car className="h-4 w-4 text-yellow-600" />}
                                          {isReservado && <Clock className="h-4 w-4 text-blue-600" />}
                                          {isInhabilitado && <Lock className="h-4 w-4 text-gray-500" />}
                                        </div>
                                        
                                        {/* Número de espacio - más compacto */}
                                        <div className="text-center w-full">
                                          <p className="font-bold text-sm">{s.numero_espacio}</p>
                                          <Badge 
                                            variant="secondary" 
                                            className={`text-[10px] px-1.5 py-0 mt-0.5 ${
                                              isDisponible ? 'bg-green-100 text-green-700 border-green-200' : 
                                              isOcupado ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                                              isReservado ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                              'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}
                                          >
                                            {isDisponible ? '✓' : 
                                             isOcupado ? '●' : 
                                             isReservado ? '◷' : 
                                             '✕'}
                                          </Badge>
                                        </div>
                                        
                                        {/* Botón de acción - más pequeño */}
                                        {!blocked && (
                                          <Button
                                            variant={isInhabilitado ? 'default' : 'secondary'}
                                            size="sm"
                                            className={`w-full h-7 text-[10px] mt-1 ${
                                              isInhabilitado 
                                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                : 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200'
                                            }`}
                                            disabled={busy}
                                            onClick={() => void handleToggleEnabled(s)}
                                          >
                                            {busy ? (
                                              <RefreshCcw className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <>
                                                {isInhabilitado ? (
                                                  <><Unlock className="h-3 w-3 mr-0.5" /> On</>
                                                ) : (
                                                  <><Lock className="h-3 w-3 mr-0.5" /> Off</>
                                                )}
                                              </>
                                            )}
                                          </Button>
                                        )}
                                        
                                        {blocked && (
                                          <div className="text-[10px] text-muted-foreground text-center mt-1 leading-tight">
                                            {isOcupado ? '🚗' : '📅'}
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                              <ParkingCircle className="h-16 w-16 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">No se encontraron espacios</p>
                            </div>
                          )}
                          {spaceError && (
                            <div className="mt-3 text-sm text-red-600">{spaceError}</div>
                          )}
                          {/* Pagination */}
                          {filteredSpaces.length > 0 && (
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                              <div>
                                Mostrando {filteredSpaces.length === 0 ? 0 : start + 1}–{Math.min(end, filteredSpaces.length)} de {filteredSpaces.length}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                  Anterior
                                </Button>
                                <div>Página {currentPage} de {totalPages}</div>
                                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                  Siguiente
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB: HISTORIAL UNIFICADO */}
                <TabsContent value="historial" className="space-y-4 mt-0 min-h-[600px]">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" /> 
                        Historial de Operaciones
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Input 
                          className="w-48" 
                          placeholder="Buscar (usuario, placa)" 
                          value={historialQuery} 
                          onChange={e => setHistorialQuery(e.target.value)} 
                        />
                        <Input 
                          type="date" 
                          value={fechaDesde} 
                          onChange={e => setFechaDesde(e.target.value)} 
                          className="w-auto"
                        />
                        <span className="text-sm text-muted-foreground">a</span>
                        <Input 
                          type="date" 
                          value={fechaHasta} 
                          onChange={e => setFechaHasta(e.target.value)} 
                          className="w-auto"
                        />
                        <Select value={estadoFiltro || "all"} onValueChange={(val) => setEstadoFiltro(val === "all" ? "" : val)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Todos los estados" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {estadosDisponibles.map(es => (
                              <SelectItem key={es} value={es}>
                                {labelByEstado(es)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => void reloadOperaciones()} 
                          disabled={opsLoading}
                          title="Refrescar"
                        >
                          <RefreshCcw className={"h-4 w-4" + (opsLoading ? " animate-spin" : "")} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {opsError && <div className="text-sm text-red-600 mb-2">{opsError}</div>}
                      {opsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Cargando historial...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Vehículo</TableHead>
                                <TableHead>Espacio</TableHead>
                                <TableHead>Duración</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead className="text-right">Detalle</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ops.map(op => {
                                const baseDate = op.fechas.pago_at || op.fechas.salida_at || op.fechas.entrada_at || op.fechas.hora_programada_inicio || op.fechas.creada_at || ""
                                const fechaStr = baseDate ? new Date(baseDate).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'
                                
                                // Usuario: priorizar usuario registrado, luego guest_nombre
                                const nombreUsuario = op.usuario 
                                  ? [op.usuario.nombre, op.usuario.apellido].filter(Boolean).join(' ')
                                  : (op.guest_nombre || 'Visitante')
                                const esInvitado = !op.usuario && op.guest_nombre
                                
                                // Vehículo: priorizar vehículo registrado, luego guest_vehiculo_*
                                const placa = op.vehiculo?.placa || op.guest_vehiculo_placa || '—'
                                const marcaVehiculo = op.vehiculo?.marca || op.guest_vehiculo_marca
                                const modeloVehiculo = op.vehiculo?.modelo || op.guest_vehiculo_modelo
                                const marcaModelo = [marcaVehiculo, modeloVehiculo].filter(Boolean).join(' ')
                                
                                const espacio = op.espacio?.numero_espacio || '—'
                                const mins = op.duracion_minutos || 0
                                const horas = Math.floor(mins/60)
                                const mm = mins % 60
                                const durStr = mins>0 ? `${horas}h ${mm}m` : '—'
                                const monto = op.pago?.monto ?? null

                                return (
                                  <TableRow key={op.id_operacion}>
                                    <TableCell className="text-sm">{fechaStr}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1.5">
                                        <Badge variant="secondary" className={colorByEstado(op.estado_final)}>
                                          {labelByEstado(op.estado_final)}
                                        </Badge>
                                        {op.pago && (
                                          <span title={op.pago.metodo || "Método de pago"}>
                                            {iconByMetodo(op.pago.metodo_tipo)}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        <span>{nombreUsuario}</span>
                                        {esInvitado && (
                                          <Badge variant="outline" className="text-xs">Invitado</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{placa}</span>
                                        {marcaModelo && <span className="text-xs text-muted-foreground">{marcaModelo}</span>}
                                      </div>
                                    </TableCell>
                                    <TableCell><Badge variant="secondary">{espacio}</Badge></TableCell>
                                    <TableCell className="text-sm">{durStr}</TableCell>
                                    <TableCell className="text-sm font-semibold">{monto != null ? `S/. ${Number(monto).toFixed(2)}` : '—'}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={() => setDetalleOperacion(op)} title="Ver detalles">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                              {ops.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                                    Sin resultados
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Modal de detalle de operación */}
                  <Dialog open={!!detalleOperacion} onOpenChange={() => setDetalleOperacion(null)}>
                    <DialogContent className="sm:max-w-[700px]">
                      <DialogHeader>
                        <DialogTitle>Detalle de operación</DialogTitle>
                        <DialogDescription>Resumen del ciclo completo y comprobante si aplica.</DialogDescription>
                      </DialogHeader>
                      {detalleOperacion && (
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div><span className="text-muted-foreground">Estado:</span> <Badge variant="secondary" className={colorByEstado(detalleOperacion.estado_final)}>{labelByEstado(detalleOperacion.estado_final)}</Badge></div>
                            <div>
                              <span className="text-muted-foreground">Usuario:</span> 
                              {detalleOperacion.usuario 
                                ? ` ${[detalleOperacion.usuario.nombre, detalleOperacion.usuario.apellido].filter(Boolean).join(' ')}`
                                : (detalleOperacion.guest_nombre ? ` ${detalleOperacion.guest_nombre}` : ' —')
                              }
                              {!detalleOperacion.usuario && detalleOperacion.guest_nombre && (
                                <Badge variant="outline" className="text-xs ml-2">Invitado</Badge>
                              )}
                            </div>
                            <div><span className="text-muted-foreground">Email:</span> {detalleOperacion.usuario?.email || '—'}</div>
                            <div><span className="text-muted-foreground">Teléfono:</span> {detalleOperacion.usuario?.telefono || detalleOperacion.guest_telefono || '—'}</div>
                            <div>
                              <span className="text-muted-foreground">Vehículo:</span> 
                              {(() => {
                                const placa = detalleOperacion.vehiculo?.placa || detalleOperacion.guest_vehiculo_placa || '—'
                                const marca = detalleOperacion.vehiculo?.marca || detalleOperacion.guest_vehiculo_marca || ''
                                const modelo = detalleOperacion.vehiculo?.modelo || detalleOperacion.guest_vehiculo_modelo || ''
                                const marcaModelo = [marca, modelo].filter(Boolean).join(' ')
                                return ` ${placa}${marcaModelo ? ` · ${marcaModelo}` : ''}`
                              })()}
                            </div>
                            <div><span className="text-muted-foreground">Espacio:</span> {detalleOperacion.espacio?.numero_espacio || '—'}</div>
                            <div><span className="text-muted-foreground">Programado:</span> {detalleOperacion.fechas.hora_programada_inicio ? new Date(detalleOperacion.fechas.hora_programada_inicio).toLocaleString('es-PE') : '—'}{detalleOperacion.fechas.hora_programada_fin ? ` → ${new Date(detalleOperacion.fechas.hora_programada_fin).toLocaleString('es-PE')}` : ''}</div>
                            <div><span className="text-muted-foreground">Entrada:</span> {detalleOperacion.fechas.entrada_at ? new Date(detalleOperacion.fechas.entrada_at).toLocaleString('es-PE') : '—'}</div>
                            <div><span className="text-muted-foreground">Salida:</span> {detalleOperacion.fechas.salida_at ? new Date(detalleOperacion.fechas.salida_at).toLocaleString('es-PE') : '—'}</div>
                            <div><span className="text-muted-foreground">Duración:</span> {(() => { const m=detalleOperacion.duracion_minutos||0; const h=Math.floor(m/60); const mm=m%60; return m>0?`${h}h ${mm}m`:'—'; })()}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="font-medium mb-1">Comprobante</div>
                            <div><span className="text-muted-foreground">Monto:</span> {detalleOperacion.pago?.monto != null ? `S/. ${Number(detalleOperacion.pago.monto).toFixed(2)}` : '—'}</div>
                            <div><span className="text-muted-foreground">Estado:</span> {detalleOperacion.pago?.estado || '—'}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Método:</span> 
                              {detalleOperacion.pago?.metodo ? (
                                <span className="flex items-center gap-1">
                                  {iconByMetodo(detalleOperacion.pago.metodo_tipo)}
                                  <span>{detalleOperacion.pago.metodo}</span>
                                </span>
                              ) : '—'}
                            </div>
                            <div><span className="text-muted-foreground">Emitido:</span> {detalleOperacion.pago?.comprobante?.emitido_en ? new Date(detalleOperacion.pago.comprobante.emitido_en).toLocaleString('es-PE') : '—'}</div>
                            <div><span className="text-muted-foreground">Tipo:</span> {detalleOperacion.pago?.comprobante?.tipo || '—'}</div>
                            <div><span className="text-muted-foreground">Serie:</span> {detalleOperacion.pago?.comprobante?.serie || '—'}</div>
                            <div><span className="text-muted-foreground">Número:</span> {detalleOperacion.pago?.comprobante?.numero ?? '—'}</div>
                            
                            {/* Botón para descargar comprobante */}
                            {detalleOperacion.pago?.id_pago && detalleOperacion.pago?.estado?.toUpperCase() === 'COMPLETADO' && (
                              <div className="mt-4">
                                <Button 
                                  onClick={() => descargarComprobante(detalleOperacion.pago!.id_pago)}
                                  disabled={descargandoComprobante}
                                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  {descargandoComprobante ? 'Descargando...' : 'Descargar Comprobante PDF'}
                                </Button>
                              </div>
                            )}
                            
                            <div className="mt-3">
                              <div className="font-medium mb-1 flex items-center gap-1"><Clock className="h-4 w-4" /> Línea de tiempo</div>
                              <div className="space-y-1">
                                {(!detalleOperacion.timeline || detalleOperacion.timeline.length === 0) && (
                                  <div className="text-muted-foreground">Sin eventos</div>
                                )}
                                {(detalleOperacion.timeline || buildTimeline(detalleOperacion)).map(ev => (
                                  <div key={ev.key+ev.at} className="flex items-center justify-between border rounded-md px-2 py-1">
                                    <div className="text-sm">{ev.label}</div>
                                    <div className="text-xs text-muted-foreground">{ev.at ? new Date(ev.at).toLocaleString('es-PE') : '—'}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button onClick={() => setDetalleOperacion(null)}>Cerrar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>
              </Tabs>

              {/* DIALOG: TARIFA */}
              <Dialog open={isTarifaDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>{editingTarifa ? 'Editar tarifa' : 'Nueva tarifa'}</DialogTitle>
                    <DialogDescription>Define tipo, monto y condiciones de la tarifa.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm" htmlFor="tipo">Tipo</label>
                      <div className="col-span-3">
                        <Select 
                          value={(tarifaForm.tipo || '').toLowerCase()}
                          onValueChange={(val) => setTarifaForm(v => ({ ...v, tipo: val }))}
                        >
                          <SelectTrigger id="tipo" className="w-full">
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hora">Hora</SelectItem>
                            <SelectItem value="medio dia">Medio día</SelectItem>
                            <SelectItem value="dia">Día</SelectItem>
                            <SelectItem value="semana">Semana</SelectItem>
                            <SelectItem value="mes">Mes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm" htmlFor="monto">Monto</label>
                      <div className="col-span-3">
                        <Input 
                          id="monto" 
                          type="number" 
                          step="0.01" 
                          value={tarifaForm.monto} 
                          onChange={e => setTarifaForm(v => ({ ...v, monto: e.target.value }))} 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm" htmlFor="condiciones">Condiciones</label>
                      <div className="col-span-3">
                        <Textarea 
                          id="condiciones" 
                          value={tarifaForm.condiciones} 
                          onChange={e => setTarifaForm(v => ({ ...v, condiciones: e.target.value }))} 
                          placeholder="Texto libre (opcional)" 
                        />
                      </div>
                    </div>
                  </div>
                  {tarifaError && (
                    <div className="text-sm text-red-600">{tarifaError}</div>
                  )}
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={handleCloseDialog}
                      disabled={isSubmittingTarifa}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => void submitTarifa()} 
                      disabled={isSubmittingTarifa}
                    >
                      {isSubmittingTarifa ? 'Procesando...' : (editingTarifa ? 'Guardar' : 'Crear')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Payment Modal */}
              {selectedOcupacion && (
                <PaymentModal
                  isOpen={isPaymentModalOpen}
                  onClose={() => setIsPaymentModalOpen(false)}
                  ocupacion={selectedOcupacion}
                  onSuccess={handlePaymentSuccess}
                />
              )}

              {/* Manual Reserve Modal */}
              <ManualReserveModal
                isOpen={isManualReserveModalOpen}
                onClose={() => setIsManualReserveModalOpen(false)}
                onSuccess={() => {
                  void reloadReservas()
                  void reloadSpaces()
                }}
                parkingId={parkingId!}
                espaciosDisponibles={spaces.filter(s => s.estado === 'disponible')}
              />
            </>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  )
}
