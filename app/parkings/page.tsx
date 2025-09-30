"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Eye, MapPin, Car, DollarSign } from "lucide-react"
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
  const [deleteReason, setDeleteReason] = useState("")
  const [deleteError, setDeleteError] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [opMessage, setOpMessage] = useState<string>("")
  const [opType, setOpType] = useState<"success" | "error" | "">("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewParking, setViewParking] = useState<any>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string>("")
  const [selectedParking, setSelectedParking] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    totalSpaces: "",
    hourlyRate: "",
    adminId: "",
    lat: "",
    lng: "",
  })

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
    const payload = {
      nombre: formData.name,
      direccion: formData.address,
      capacidad_total: Number.parseInt(formData.totalSpaces),
      latitud: Number(formData.lat),
      longitud: Number(formData.lng),
      id_admin_asignado: formData.adminId || undefined,
    }
    // Validación simple
    if (!payload.nombre || !payload.direccion || !payload.capacidad_total || isNaN(payload.latitud) || isNaN(payload.longitud)) {
      setOpMessage("Completa nombre, dirección, capacidad y coordenadas válidas (latitud/longitud)")
      setOpType("error")
      return
    }
    try {
      await apiCreateParking(payload)
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
      setIsCreateDialogOpen(false)
      setFormData({ name: "", address: "", totalSpaces: "", hourlyRate: "", adminId: "", lat: "", lng: "" })
      setOpMessage("Parking creado correctamente")
      setOpType("success")
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "No se pudo crear el parking"
      setOpMessage(message)
      setOpType("error")
    }
  }

  const handleEdit = async () => {
    // Actualizar datos básicos
    await apiUpdateParking(selectedParking.id_parking || selectedParking.id, {
      nombre: formData.name,
      direccion: formData.address,
      capacidad_total: formData.totalSpaces ? Number(formData.totalSpaces) : undefined,
      latitud: formData.lat ? Number(formData.lat) : undefined,
      longitud: formData.lng ? Number(formData.lng) : undefined,
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
      lat: parking.latitud ? String(parking.latitud) : "",
      lng: parking.longitud ? String(parking.longitud) : "",
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
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nombre del parking"
                      />
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
                          onChange={(e) => setFormData({ ...formData, totalSpaces: e.target.value })}
                          placeholder="150"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hourlyRate">Tarifa/Hora (S/. )</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          step="0.1"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                          placeholder="2.50"
                        />
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
                    {(formData.lat && formData.lng) && (
                      <div className="rounded-md overflow-hidden border">
                        <iframe
                          title="Ubicación del parking"
                          className="w-full h-48"
                          src={`https://www.openstreetmap.org/export/embed.html?&marker=${encodeURIComponent(formData.lat)},${encodeURIComponent(formData.lng)}`}
                        />
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          Vista previa del mapa (OpenStreetMap)
                        </div>
                      </div>
                    )}
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
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
                      Crear Parking
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
                  onChange={(e) => setFormData({ ...formData, totalSpaces: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-hourlyRate">Tarifa/Hora (S/. )</Label>
                <Input
                  id="edit-hourlyRate"
                  type="number"
                  step="0.1"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-lat">Latitud</Label>
                <Input
                  id="edit-lat"
                  type="number"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lng">Longitud</Label>
                <Input
                  id="edit-lng"
                  type="number"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Actualiza coordenadas o usa tu ubicación actual.</p>
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
            {(formData.lat && formData.lng) && (
              <div className="rounded-md overflow-hidden border">
                <iframe
                  title="Ubicación del parking (edición)"
                  className="w-full h-48"
                  src={`https://www.openstreetmap.org/export/embed.html?&marker=${encodeURIComponent(formData.lat)},${encodeURIComponent(formData.lng)}`}
                />
                <div className="px-3 py-2 text-xs text-muted-foreground">Vista previa del mapa</div>
              </div>
            )}
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Guardar Cambios</Button>
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
