"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Eye, MapPin, Car, DollarSign, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// API clients
import { listAllParkings, listParkingsByUser, getParkingById, createParking as apiCreateParking, updateParking as apiUpdateParking, assignAdminToParking as apiAssignAdminToParking, softDeleteParking as apiSoftDeleteParking, type ParkingRecord } from "@/lib/parkings"
import { listUsers, type UserRecord } from "@/lib/users"
import { useAuth } from "@/components/auth-guard"

export default function ParkingsPage() {
  const { user } = useAuth()
  const [parkings, setParkings] = useState<Array<{
    id: string
    name: string
    address?: string
    totalSpaces?: number
    occupiedSpaces?: number
    hourlyRate?: number
    status?: string
    adminName?: string
    revenue?: number
    id_parking?: number
    id_admin?: string
    latitud?: number
    longitud?: number
  }>>([])
  const [admins, setAdmins] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [deleteError, setDeleteError] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [opMessage, setOpMessage] = useState<string>("")
  const [opType, setOpType] = useState<"success" | "error" | "">("")

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string>("")
  const [viewParking, setViewParking] = useState<any>(null)

  const [selectedParking, setSelectedParking] = useState<any>(null)

  // Función para manejar cierre del diálogo con confirmación
  const handleDialogClose = (open: boolean) => {
    if (!open && hasUnsavedChanges()) {
      const confirmClose = window.confirm("¿Estás seguro de que quieres cerrar? Se perderán los cambios no guardados.")
      if (!confirmClose) return false
    }
    setIsCreateDialogOpen(open)
    return true
  }

  // Función para verificar si hay cambios no guardados
  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData)
  }

const [formData, setFormData] = useState({
  name: "",
  address: "",
  totalSpaces: "",
  hourlyRate: "",
  adminId: "",
  lat: "-11.985608",
  lng: "-77.07203",
})

// Estado inicial para comparar cambios
const initialFormData = {
  name: "",
  address: "",
  totalSpaces: "",
  hourlyRate: "",
  adminId: "",
  lat: "-11.985608",
  lng: "-77.07203",
}

// Funciones de validación
const lettersOnly = (v: string) => v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "")
const digitsOnly = (v: string) => v.replace(/[^0-9]/g, "")
const decimal2 = (v: string) => {
  // permitir solo 0-9 y un punto, y máximo 2 decimales
  let s = v.replace(/[^0-9.]/g, "")
  const parts = s.split(".")
  if (parts.length > 2) {
    s = parts[0] + "." + parts.slice(1).join("")
  }
  const [intp, decp = ""] = s.split(".")
  return decp ? `${intp}.${decp.slice(0, 2)}` : intp
}
const isNumber = (v: string) => v !== "" && !Number.isNaN(Number(v))
const inRange = (n: number, min: number, max: number) => n >= min && n <= max

// Validaciones derivadas
const validName = formData.name.trim().length >= 2 && /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.name)
const validTotal = isNumber(formData.totalSpaces) && Number(formData.totalSpaces) > 0
const validLat = isNumber(formData.lat) && inRange(Number(formData.lat), -90, 90)
const validLng = isNumber(formData.lng) && inRange(Number(formData.lng), -180, 180)
const validCoords = validLat && validLng
const canCreate = validName && validTotal && validCoords && !!formData.address.trim()
const canEdit = (validName || formData.name.trim().length > 0) && 
  (formData.totalSpaces === "" || validTotal) && 
  (!formData.lat && !formData.lng ? true : validCoords)

  // MapPicker: componente interno que carga Leaflet por CDN y permite elegir coordenadas clickeando el mapa
  function MapPicker({
    lat,
    lng,
    onChange,
    height = 300,
  }: { lat?: string | number; lng?: string | number; onChange: (lat: number, lng: number) => void; height?: number }) {
    const mapRef = useRef<HTMLDivElement | null>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)

    // Utilidades para cargar CSS/JS de Leaflet solo una vez
    const ensureLeafletLoaded = async () => {
      const win = window as any
      if (win.L) return
      // Cargar CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)
      }
      // Cargar JS
      await new Promise<void>((resolve, reject) => {
        if (win.L) return resolve()
        const scriptId = 'leaflet-js'
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error('Leaflet load error')), { once: true })
          // Si ya cargó previamente
          if ((existing as any)._loaded) return resolve()
          return
        }
        const script = document.createElement('script')
        script.id = scriptId
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = ''
        script.async = true
        ;(script as any)._loaded = false
        script.onload = () => { (script as any)._loaded = true; resolve() }
        script.onerror = () => reject(new Error('Leaflet load error'))
        document.body.appendChild(script)
      })
    }

    // Inicializar mapa una vez
    useEffect(() => {
      let destroyed = false
      const init = async () => {
        if (!mapRef.current) return
        await ensureLeafletLoaded()
        if (destroyed) return
        const win = window as any
        const L = win.L
        const startLat = typeof lat === 'string' ? parseFloat(lat) : typeof lat === 'number' ? lat : -11.985608 // Los Olivos, Peru (UTP sede Lima Norte)
        const startLng = typeof lng === 'string' ? parseFloat(lng) : typeof lng === 'number' ? lng : -77.07203
        const map = L.map(mapRef.current).setView([startLat, startLng], 13)
        mapInstanceRef.current = map
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map)
        // Marcador inicial si hay coords
        if (!isNaN(startLat) && !isNaN(startLng)) {
          markerRef.current = L.marker([startLat, startLng], { draggable: true }).addTo(map)
          markerRef.current.on('dragend', (e: any) => {
            const pos = e.target.getLatLng()
            onChange(pos.lat, pos.lng)
          })
        }
        // Click para seleccionar
        map.on('click', (e: any) => {
          const { lat: clat, lng: clng } = e.latlng
          if (!markerRef.current) {
            markerRef.current = L.marker([clat, clng], { draggable: true }).addTo(map)
            markerRef.current.on('dragend', (ev: any) => {
              const pos = ev.target.getLatLng()
              onChange(pos.lat, pos.lng)
            })
          } else {
            markerRef.current.setLatLng([clat, clng])
          }
          onChange(clat, clng)
        })
      }
      void init()
      return () => {
        destroyed = true
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
          }
        } catch {}
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Cuando cambian props lat/lng, actualizar marcador y centrar suavemente
    useEffect(() => {
      const L = (window as any).L
      const map = mapInstanceRef.current
      if (!L || !map) return
      const nlat = typeof lat === 'string' ? parseFloat(lat) : (lat as number)
      const nlng = typeof lng === 'string' ? parseFloat(lng) : (lng as number)
      if (isNaN(nlat) || isNaN(nlng)) return
      if (!markerRef.current) {
        markerRef.current = L.marker([nlat, nlng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', (e: any) => {
          const pos = e.target.getLatLng()
          onChange(pos.lat, pos.lng)
        })
      } else {
        markerRef.current.setLatLng([nlat, nlng])
      }
      map.setView([nlat, nlng], Math.max(map.getZoom(), 13))
    }, [lat, lng])

    return (
      <div className="rounded-md overflow-hidden border">
        <div ref={mapRef} style={{ width: '100%', height }} />
        <div className="px-3 py-2 text-xs text-muted-foreground">
          Haz click o arrastra el marcador para seleccionar coordenadas.
          {(() => {
            const nlat = typeof lat === 'string' ? parseFloat(lat) : (lat as number)
            const nlng = typeof lng === 'string' ? parseFloat(lng) : (lng as number)
            if (isNaN(nlat) || isNaN(nlng)) return null
            return (
              <span className="ml-2">
                Coordenadas: {nlat.toFixed(6)}, {nlng.toFixed(6)}
              </span>
            )
          })()}
        </div>
      </div>
    )
  }

  // Load data from API (evita doble llamada en modo dev por Strict Mode usando una clave)
  const lastFetchKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const role = user?.rol || ""
    const uid = (user as any)?.id_usuario || ""
    const key = `${role}::${uid}`
    if (!role) return
    if (lastFetchKeyRef.current === key) {
      // misma clave -> evita refetch duplicado por remount de StrictMode/HMR
      return
    }
    lastFetchKeyRef.current = key

    const load = async () => {
      try {
        setLoading(true)
        // Fetch parkings basado en rol
        const apiParks = role === "admin_parking" && uid
          ? await listParkingsByUser(uid)
          : await listAllParkings()
        // Solo admin_general necesita la lista de admins potenciales
        const apiUsers = role === "admin_general" ? await listUsers() : []
        const adminUsers = apiUsers.filter(u => u.rol === "admin_parking")
        setAdmins(adminUsers)
        const mapped = apiParks.map((p: ParkingRecord) => ({
          id: String(p.id_parking),
          id_parking: p.id_parking,
          name: p.nombre,
          address: p.direccion,
          totalSpaces: p.capacidad_total,
          occupiedSpaces: p.ocupados ?? 0,
          hourlyRate: (p as any).tarifa_hora ?? (p as any).tarifa ?? undefined,
          status: p.estado ?? "active",
          adminName: p.admin_nombre,
          id_admin: p.id_admin,
          revenue: p.revenue ?? 0,
          latitud: p.latitud,
          longitud: p.longitud,
        }))
        setParkings(mapped)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [user?.rol, (user as any)?.id_usuario])
  const handleCreate = async () => {
    try {
      setIsCreating(true)
      const payload = {
        nombre: formData.name.trim(),
        direccion: formData.address.trim(),
        capacidad_total: Number.parseInt(formData.totalSpaces),
        latitud: Number(formData.lat),
        longitud: Number(formData.lng),
        id_admin_asignado: formData.adminId || undefined, // Usar undefined para indicar sin administrador
        tarifa: formData.hourlyRate ? Number(formData.hourlyRate) : 0
      }

      // Validación básica
      if (!payload.nombre || !payload.direccion || isNaN(payload.capacidad_total) || 
          isNaN(payload.latitud) || isNaN(payload.longitud)) {
        setOpMessage("Revisa los campos requeridos antes de crear el parking")
        setOpType("error")
        return
      }

      // Crear el parking
      const result = await apiCreateParking(payload)
      
      // Si se seleccionó un admin, asignarlo (ya se envía en el payload)
      // La asignación se maneja directamente en el backend

      // Cerrar diálogo y limpiar formulario
      setIsCreateDialogOpen(false)
      setFormData(initialFormData)
      
      // Recargar la lista de parkings
      const fresh = await listAllParkings()
      const mapped = fresh.map((p: ParkingRecord) => ({
        id: String(p.id_parking),
        id_parking: p.id_parking,
        name: p.nombre,
        address: p.direccion,
        totalSpaces: p.capacidad_total,
        occupiedSpaces: p.ocupados ?? 0,
        hourlyRate: (p as any).tarifa_hora ?? (p as any).tarifa ?? 0,
        status: p.estado ?? "active",
        adminName: p.admin_nombre,
        id_admin: p.id_admin,
        revenue: p.revenue ?? 0,
        latitud: p.latitud,
        longitud: p.longitud,
      }))
      setParkings(mapped)
      setIsCreateDialogOpen(false)
      setFormData({ name: "", address: "", totalSpaces: "", hourlyRate: "", adminId: "", lat: "", lng: "" })
      setOpMessage("Parking creado correctamente")
      setOpType("success")
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "No se pudo crear el parking"
      setOpMessage(message)
      setOpType("error")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = async () => {
    try {
      setIsSavingEdit(true)
      // Actualizar datos básicos
      await apiUpdateParking(selectedParking.id_parking || selectedParking.id, {
        nombre: formData.name,
        direccion: formData.address,
        capacidad_total: formData.totalSpaces ? Number(formData.totalSpaces) : undefined,
        latitud: formData.lat ? Number(formData.lat) : undefined,
        longitud: formData.lng ? Number(formData.lng) : undefined,
        // Enviar tarifa hora para que el backend la actualice (acepta tarifa|tarifa_hora)
        tarifa: formData.hourlyRate !== "" ? Number(formData.hourlyRate) : undefined,
      })
      // Asignación de admin si cambió
      if (formData.adminId && formData.adminId !== selectedParking.id_admin) {
        await apiAssignAdminToParking(selectedParking.id_parking || selectedParking.id, formData.adminId)
      }
      // Refrescar lista
      const fresh = await listAllParkings()
      const mapped = fresh.map((p: ParkingRecord) => ({
        id: String(p.id_parking),
        id_parking: p.id_parking,
        name: p.nombre,
        address: p.direccion,
        totalSpaces: p.capacidad_total,
        occupiedSpaces: p.ocupados ?? 0,
        hourlyRate: (p as any).tarifa_hora ?? (p as any).tarifa ?? undefined,
        status: p.estado ?? "active",
        adminName: p.admin_nombre,
        id_admin: p.id_admin,
        revenue: p.revenue ?? 0,
        latitud: p.latitud,
        longitud: p.longitud,
      }))
      setParkings(mapped)
      setIsEditDialogOpen(false)
      setSelectedParking(null)
      setOpMessage("Cambios guardados correctamente")
      setOpType("success")
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "No se pudo guardar los cambios"
      setOpMessage(message)
      setOpType("error")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    // Baja lógica (soft delete)
    try {
      setIsDeleting(true)
      setDeleteError("")
      console.log("[UI] Intentando dar de baja parking", { id: selectedParking.id, motivo: deleteReason })
      await apiSoftDeleteParking(selectedParking.id_parking || selectedParking.id, deleteReason || undefined)
      // Remover la fila del listado para reflejar desaparición inmediata
      setParkings(prev => prev.filter(p => p.id !== selectedParking.id))
      setOpMessage(`Parking "${selectedParking.name}" dado de baja correctamente${deleteReason ? ` (motivo: ${deleteReason})` : ''}.`)
      setOpType("success")
      setIsDeleteDialogOpen(false)
      setDeleteReason("")
      setSelectedParking(null)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "No se pudo dar de baja el parking"
      console.error("Soft delete error:", err?.response?.data || err)
      setDeleteError(message)
      setOpMessage(message)
      setOpType("error")
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (parking: any) => {
    setSelectedParking(parking)
    setFormData({
      name: parking.name,
      address: parking.address || "",
      totalSpaces: String(parking.totalSpaces ?? ""),
      hourlyRate: String(parking.hourlyRate ?? ""),
      adminId: parking.id_admin || "",
      // Asegurarse de que las coordenadas tengan valores por defecto si no existen
      lat: parking.latitud ? String(parking.latitud) : "-11.985608",
      lng: parking.longitud ? String(parking.longitud) : "-77.07203",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (parking: any) => {
    setSelectedParking(parking)
    setDeleteReason("")
    setDeleteError("")
    setIsDeleteDialogOpen(true)
  }

  const openViewDialog = async (parking: any) => {
    try {
      setViewError("")
      setIsViewDialogOpen(true)
      setViewLoading(true)
      // Usa datos disponibles inmediatamente
      setViewParking(parking)
      // Refresca datos desde API
      const fresh = await getParkingById(parking.id_parking || parking.id)
      // Fusiona por si faltan campos como admin_nombre del listado
      setViewParking({
        ...parking,
        ...fresh,
        // normaliza nombres de campos para el UI
        nombre: fresh?.nombre ?? parking.name ?? parking.nombre,
        direccion: fresh?.direccion ?? parking.address ?? parking.direccion,
        latitud: fresh?.latitud ?? parking.latitud,
        longitud: fresh?.longitud ?? parking.longitud,
        capacidad_total: fresh?.capacidad_total ?? parking.totalSpaces,
        id_admin: fresh?.id_admin ?? parking.id_admin,
        admin_nombre: parking.adminName ?? fresh?.admin_nombre,
        estado: fresh?.estado ?? parking.status,
        revenue: parking.revenue,
      })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "No se pudo obtener el detalle del parking"
      setViewError(message)
    } finally {
      setViewLoading(false)
    }
  }

  const getOccupancyPercentage = (occupied: number, total: number) => {
    return Math.round((occupied / total) * 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Mantenimiento</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactivo</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (<>
      {opType && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded shadow ${opType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          <div className="flex items-center gap-3">
            <span className="text-sm">{opMessage}</span>
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => { setOpType(""); setOpMessage("") }}>Cerrar</Button>
          </div>
        </div>
      )}
      <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs items={[{ label: "Gestión de Parkings" }]} />

          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-balance">Gestión de Parkings</h1>
                <p className="text-muted-foreground mt-2">Administra todos los estacionamientos del sistema</p>
              </div>

              {user?.rol === "admin_general" && (
                <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Parking
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[720px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Parking</DialogTitle>
                    <DialogDescription>Completa la información del nuevo estacionamiento.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: lettersOnly(e.target.value) })}
                        placeholder="Nombre del parking"
                      />
                      {!validName && formData.name !== "" && (
                        <p className="text-xs text-red-600">Solo letras y espacios (mín. 2 caracteres).</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Dirección completa"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="totalSpaces">Plazas Totales</Label>
                        <Input
                          id="totalSpaces"
                          type="number"
                          value={formData.totalSpaces}
                          onChange={(e) => setFormData({ ...formData, totalSpaces: digitsOnly(e.target.value) })}
                          placeholder="150"
                        />
                        {!validTotal && formData.totalSpaces !== "" && (
                          <p className="text-xs text-red-600">Ingrese un número entero mayor a 0.</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hourlyRate">Tarifa/Hora (S/. )</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          step="0.1"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: decimal2(e.target.value) })}
                          placeholder="2.50"
                        />
                        {formData.hourlyRate !== "" && !isNumber(formData.hourlyRate) && (
                          <p className="text-xs text-red-600">Ingrese un número válido</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="lat">Latitud</Label>
                        <Input
                          id="lat"
                          type="number"
                          value={formData.lat}
                          onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                          placeholder="Ej: -12.0464"
                        />
                        {!validLat && formData.lat !== "" && (
                          <p className="text-xs text-red-600">Latitud entre -90 y 90.</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lng">Longitud</Label>
                        <Input
                          id="lng"
                          type="number"
                          value={formData.lng}
                          onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                          placeholder="Ej: -77.0428"
                        />
                        {!validLng && formData.lng !== "" && (
                          <p className="text-xs text-red-600">Longitud entre -180 y 180.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Puedes pegar coordenadas o usar tu ubicación actual.</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (typeof navigator !== "undefined" && navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              const { latitude, longitude } = pos.coords
                              setFormData((prev) => ({ ...prev, lat: String(latitude), lng: String(longitude) }))
                            })
                          }
                        }}
                      >
                        Usar mi ubicación
                      </Button>
                    </div>
                    <MapPicker
                      lat={formData.lat}
                      lng={formData.lng}
                      onChange={(clat, clng) => setFormData((prev) => ({ ...prev, lat: String(clat), lng: String(clng) }))}
                      height={300}
                    />
                    {user?.rol === "admin_general" && (
                      <div className="grid gap-2">
                        <Label>Administrador Asignado</Label>
                        <Select value={formData.adminId} onValueChange={(v) => setFormData({ ...formData, adminId: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un admin_parking (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {admins.map(a => (
                              <SelectItem key={a.id || a.id_usuario} value={String(a.id || a.id_usuario)}>
                                {a.nombre} {a.apellido} - {a.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="cursor-pointer" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 cursor-pointer active:scale-[.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 transition" disabled={!canCreate || isCreating}>
                      {isCreating ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creando...
                        </span>
                      ) : (
                        "Crear Parking"
                      )}
                    </Button>
                  </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Parkings</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parkings.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {parkings.filter((p) => p.status === "active").length} activos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Plazas Totales</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parkings.reduce((acc, p) => acc + (p.totalSpaces ?? 0), 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {parkings.reduce((acc, p) => acc + (p.occupiedSpaces ?? 0), 0)} ocupadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    S/. {parkings.reduce((acc, p) => acc + (p.revenue ?? 0), 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Este mes</p>
                </CardContent>
              </Card>
            </div>

            {/* Parkings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Parkings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead>Ocupación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Administrador</TableHead>
                        <TableHead>Ingresos</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parkings.map((parking) => (
                        <TableRow key={parking.id}>
                          <TableCell className="font-medium">{parking.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{parking.address}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {parking.occupiedSpaces ?? 0}/{parking.totalSpaces ?? 0}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {getOccupancyPercentage(parking.occupiedSpaces ?? 0, parking.totalSpaces || 1)}%
                              </Badge>
                            </div>
                          </TableCell>
                          {/* Columnas de Tarifa y Mapa removidas por requerimiento */}
                          <TableCell>{getStatusBadge(parking.status || "active")}</TableCell>
                          <TableCell>{parking.adminName || "—"}</TableCell>
                          <TableCell>{typeof parking.revenue === "number" ? `S/. ${parking.revenue.toFixed(2)}` : "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" onClick={() => openViewDialog(parking)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(user?.rol === "admin_general" || user?.rol === "admin_parking") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => openEditDialog(parking)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {(user?.rol === "admin_general" || user?.rol === "admin_parking") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => openDeleteDialog(parking)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Edit Dialog */} 
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Editar Parking</DialogTitle>
            <DialogDescription>Modifica la información del estacionamiento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Dirección</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-totalSpaces">Plazas Totales</Label>
                <Input
                  id="edit-totalSpaces"
                  type="number"
                  value={formData.totalSpaces}
                  onChange={(e) => setFormData({ ...formData, totalSpaces: digitsOnly(e.target.value) })}
                />
                {!validTotal && formData.totalSpaces !== "" && (
                  <p className="text-xs text-red-600">Ingrese un número entero mayor a 0.</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-hourlyRate">Tarifa/Hora (S/. )</Label>
                <Input
                  id="edit-hourlyRate"
                  type="number"
                  step="0.1"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: decimal2(e.target.value) })}
                />
                {formData.hourlyRate !== "" && !isNumber(formData.hourlyRate) && (
                  <p className="text-xs text-red-600">Ingrese un número válido</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-lat">Latitud</Label>
                <Input
                  id="edit-lat"
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                />
                {!validLat && formData.lat !== "" && (
                  <p className="text-xs text-red-600">Latitud entre -90 y 90.</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lng">Longitud</Label>
                <Input
                  id="edit-lng"
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                />
                {!validLng && formData.lng !== "" && (
                  <p className="text-xs text-red-600">Longitud entre -180 y 180.</p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Arrastra el marcador para cambiar la ubicación o haz clic en el mapa
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        const { latitude, longitude } = pos.coords
                        setFormData(prev => ({
                          ...prev,
                          lat: String(latitude),
                          lng: String(longitude)
                        }))
                      })
                    }
                  }}
                >
                  Usar mi ubicación
                </Button>
              </div>
              
              <div className="rounded-md border overflow-hidden" style={{ height: '300px' }}>
                <MapPicker
                  lat={formData.lat}
                  lng={formData.lng}
                  onChange={(lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      lat: String(lat),
                      lng: String(lng)
                    }))
                  }}
                  height={300}
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Coordenadas actuales: {formData.lat && formData.lng ? `${formData.lat}, ${formData.lng}` : 'No definidas'}</p>
              </div>
            </div>
            {/* Mostrar selector de administrador solo para admin_general */}
            {user?.rol === "admin_general" && (
              <div className="grid gap-2">
                <Label>Administrador Asignado</Label>
                <Select value={formData.adminId} onValueChange={(v) => setFormData({ ...formData, adminId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona admin_parking" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.map(a => (
                      <SelectItem key={a.id || a.id_usuario} value={String(a.id || a.id_usuario)}>
                        {a.nombre} {a.apellido} - {a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!canEdit || isSavingEdit}
              className="cursor-pointer active:scale-[.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition"
            >
              {isSavingEdit ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      {user?.rol === "admin_general" && (
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de baja (borrado lógico)</DialogTitle>
            <DialogDescription>
              Esta acción marca el parking como inactivo y no lo elimina definitivamente. Puedes indicar un motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="delete-reason">Motivo (opcional)</Label>
            <Textarea
              id="delete-reason"
              rows={3}
              placeholder="Describe el motivo de la baja"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
            {deleteError && (
              <p className="text-sm text-red-600">{deleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              Dar de baja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Detalle del Parking</DialogTitle>
            <DialogDescription>Información completa del estacionamiento seleccionado.</DialogDescription>
          </DialogHeader>
          {viewLoading ? (
            <div className="py-6 text-sm text-muted-foreground">Cargando...</div>
          ) : (
            <div className="grid gap-4 py-2">
              {viewError && <p className="text-sm text-red-600">{viewError}</p>}
              {viewParking && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre</p>
                      <p className="font-medium">{viewParking.nombre || viewParking.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Administrador</p>
                      <p className="font-medium">{viewParking.admin_nombre || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Dirección</p>
                      <p className="font-medium break-words">{viewParking.direccion || viewParking.address || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Capacidad total</p>
                      <p className="font-medium">{viewParking.capacidad_total ?? viewParking.totalSpaces ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <p className="font-medium">{viewParking.estado || viewParking.status || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Latitud</p>
                      <p className="font-medium">{typeof viewParking.latitud === 'number' ? viewParking.latitud : (viewParking.lat ?? "—")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Longitud</p>
                      <p className="font-medium">{typeof viewParking.longitud === 'number' ? viewParking.longitud : (viewParking.lng ?? "—")}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Ingresos</p>
                      <p className="font-medium">{typeof viewParking.revenue === 'number' ? `S/. ${viewParking.revenue.toFixed(2)}` : "—"}</p>
                    </div>
                  </div>
                  {(viewParking.latitud && viewParking.longitud) && (
                    <div className="rounded-md overflow-hidden border">
                      <iframe
                        title="Ubicación del parking (detalle)"
                        className="w-full h-48"
                        src={`https://www.openstreetmap.org/export/embed.html?&marker=${encodeURIComponent(String(viewParking.latitud))},${encodeURIComponent(String(viewParking.longitud))}`}
                      />
                      <div className="px-3 py-2 text-xs text-muted-foreground">Vista del mapa (OpenStreetMap)</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
