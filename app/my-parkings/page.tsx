"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { MetricsCard } from "@/components/metrics-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AuthGuard, useAuth } from "@/components/auth-guard"
import { LeafletMapPicker } from "@/components/leaflet-map-picker"
import { Eye, Edit, Trash2, ParkingCircle, Car, DollarSign, Calendar } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { listParkingsByUser, listParkingsByAdmin, getParkingById, updateParking as apiUpdateParking, softDeleteParking as apiSoftDeleteParking, type ParkingRecord } from "@/lib/parkings"


export default function MyParkingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [parkings, setParkings] = useState<Array<{
    id: string
    id_parking: number
    name: string
    address?: string
    totalSpaces?: number
    occupiedSpaces?: number
    status?: string
    revenue?: number
    latitud?: number
    longitud?: number
  }>>([])
  const [selectedParkingId, setSelectedParkingId] = useState<string>("")
  const [selectedParking, setSelectedParking] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [formData, setFormData] = useState({ name: "", address: "", totalSpaces: "", lat: "", lng: "" })
  const [mapUrl, setMapUrl] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewParking, setViewParking] = useState<any>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string>("")
  const lastFetchKeyRef = useRef<string | null>(null)

  // Cargar SOLO mis parkings desde API
  useEffect(() => {
    const role = user?.rol || ""
    const uid = (user as any)?.id_usuario || ""
    // Asegurar uso del id_usuario (numérico) para usuario_parking y dejar id (uuid) solo para legacy id_admin si aplica
    const adminId = (user as any)?.id_admin ? (user as any).id_admin : (user as any)?.id || ""
    const key = `${role}::${uid}`
    if (role !== "admin_parking" || (!uid && !adminId)) return
    if (lastFetchKeyRef.current === key) return
    lastFetchKeyRef.current = key

    const load = async () => {
      try {
        setLoading(true)
        // Intentar por admin asignado primero; fallback a asignaciones por usuario
        const [byAdmin, byUser] = await Promise.all([
          adminId ? listParkingsByAdmin(adminId) : Promise.resolve([]),
          uid ? listParkingsByUser(String(uid)) : Promise.resolve([]),
        ])
        // Logs de diagnóstico en cliente
        try {
          const aIds = (Array.isArray(byAdmin) ? byAdmin : []).map((p: any) => p?.id_parking).filter(Boolean)
          const uIds = (Array.isArray(byUser) ? byUser : []).map((p: any) => p?.id_parking).filter(Boolean)
          console.log('[my-parkings] byAdmin count/ids =', aIds.length, aIds)
          console.log('[my-parkings] byUser  count/ids =', uIds.length, uIds)
        } catch {}
        const combined: ParkingRecord[] = [...(Array.isArray(byAdmin) ? byAdmin : []), ...(Array.isArray(byUser) ? byUser : [])]
        // Unificar por id_parking para evitar duplicados
        const unique = Object.values(Object.fromEntries(combined.map((p: any) => [p.id_parking, p]))) as ParkingRecord[]
        try {
          const cIds = combined.map((p: any) => p?.id_parking).filter(Boolean)
          const uIds2 = (unique as any[]).map((p: any) => p?.id_parking).filter(Boolean)
          console.log('[my-parkings] combined count/ids =', cIds.length, cIds)
          console.log('[my-parkings] unique   count/ids =', uIds2.length, uIds2)
        } catch {}
        const mapped = (unique as any[]).map((p: ParkingRecord) => ({
          id: String(p.id_parking),
          id_parking: p.id_parking,
          name: p.nombre,
          address: p.direccion,
          totalSpaces: p.capacidad_total,
          occupiedSpaces: (p as any).ocupados ?? 0,
          status: p.estado ?? "active",
          revenue: (p as any).revenue ?? 0,
          latitud: p.latitud,
          longitud: p.longitud,
        }))
        setParkings(mapped)
        setSelectedParkingId(mapped[0]?.id || "")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [user?.rol, (user as any)?.id_usuario])

  useEffect(() => {
    const current = parkings.find(p => p.id === selectedParkingId) || parkings[0]
    setSelectedParking(current || null)
  }, [selectedParkingId, parkings])

  const openViewDialog = async (p: any) => {
    try {
      setViewError("")
      setIsViewDialogOpen(true)
      setViewLoading(true)
      setViewParking(p)
      const fresh = await getParkingById(p.id_parking || p.id)
      setViewParking({
        ...p,
        ...fresh,
        nombre: fresh?.nombre ?? p?.name ?? p?.nombre,
        direccion: fresh?.direccion ?? p?.address ?? p?.direccion,
        latitud: fresh?.latitud ?? p?.latitud,
        longitud: fresh?.longitud ?? p?.longitud,
        capacidad_total: fresh?.capacidad_total ?? p?.totalSpaces,
        id_admin: fresh?.id_admin ?? p?.id_admin,
        estado: fresh?.estado ?? p?.status,
        revenue: p?.revenue,
      })
    } catch (err: any) {
      setViewError(err?.response?.data?.message || err?.message || "No se pudo obtener el detalle del parking")
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

  const openEditDialog = (p: any) => {
    setSelectedParking(p)
    setFormData({
      name: p?.name || "",
      address: p?.address || "",
      totalSpaces: String(p?.totalSpaces ?? ""),
      lat: p?.latitud ? String(p.latitud) : "-11.985608",
      lng: p?.longitud ? String(p.longitud) : "-77.07203",
    })
    setIsEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedParking) return
    try {
      setIsSaving(true)
      const id = selectedParking.id_parking
      const payload: any = {
        nombre: formData.name?.trim() || undefined,
        direccion: formData.address?.trim() || undefined,
        capacidad_total: formData.totalSpaces ? Number(formData.totalSpaces) : undefined,
      }
      if (formData.lat) payload.latitud = Number(formData.lat)
      if (formData.lng) payload.longitud = Number(formData.lng)

      await apiUpdateParking(id, payload)

      // Refrescar lista igual que el load inicial (combinar admin y user, deduplicar)
      const role = user?.rol || ""
      const uid = (user as any)?.id_usuario || ""
      const adminId = (user as any)?.id || uid || ""
      const [byAdmin, byUser] = await Promise.all([
        adminId ? listParkingsByAdmin(adminId) : Promise.resolve([]),
        uid ? listParkingsByUser(String(uid)) : Promise.resolve([]),
      ])
      const combined: ParkingRecord[] = [...(Array.isArray(byAdmin) ? byAdmin : []), ...(Array.isArray(byUser) ? byUser : [])]
      try {
        const aIds = (Array.isArray(byAdmin) ? byAdmin : []).map((p: any) => p?.id_parking).filter(Boolean)
        const uIds = (Array.isArray(byUser) ? byUser : []).map((p: any) => p?.id_parking).filter(Boolean)
        const cIds = combined.map((p: any) => p?.id_parking).filter(Boolean)
        console.log('[my-parkings][refresh] byAdmin ids =', aIds)
        console.log('[my-parkings][refresh] byUser  ids =', uIds)
        console.log('[my-parkings][refresh] combined ids =', cIds)
      } catch {}
      const unique = Object.values(Object.fromEntries((combined as any[]).map((p: any) => [p.id_parking, p]))) as any[]
      try {
        const uIds2 = unique.map((p: any) => p?.id_parking).filter(Boolean)
        console.log('[my-parkings][refresh] unique ids =', uIds2)
      } catch {}
      const mapped = unique.map((p: any) => ({
        id: String(p.id_parking),
        id_parking: p.id_parking,
        name: p.nombre,
        address: p.direccion,
        totalSpaces: p.capacidad_total,
        occupiedSpaces: (p as any).ocupados ?? 0,
        status: p.estado ?? "active",
        revenue: (p as any).revenue ?? 0,
        latitud: p.latitud,
        longitud: p.longitud,
      }))
      setParkings(mapped)

      toast({ title: "Cambios guardados", description: "El parking se actualizó correctamente." })
      setIsEditDialogOpen(false)
      setSelectedParking(null)
    } catch (err: any) {
      console.error("Error al actualizar parking:", err)
      toast({ title: "Error al guardar", description: "No se pudo actualizar el parking.", variant: "destructive" as any })
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteDialog = (p: any) => {
    setSelectedParking(p)
    setDeleteReason("")
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedParking) return
    try {
      setIsDeleting(true)
      await apiSoftDeleteParking(selectedParking.id_parking, deleteReason || undefined)
      const uid = (user as any)?.id_usuario
      const fresh = await listParkingsByUser(uid)
      const mapped = (fresh as any[]).map((p: ParkingRecord) => ({
        id: String(p.id_parking),
        id_parking: p.id_parking,
        name: p.nombre,
        address: p.direccion,
        totalSpaces: p.capacidad_total,
        occupiedSpaces: (p as any).ocupados ?? 0,
        status: p.estado ?? "active",
        revenue: (p as any).revenue ?? 0,
        latitud: p.latitud,
        longitud: p.longitud,
      }))
      setParkings(mapped)
      setIsDeleteDialogOpen(false)
      setSelectedParking(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AuthGuard allowedRoles={["admin_parking"]}>
      <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs items={[{ label: "Mis Parkings" }]} />

          <div className="space-y-6">
            {/* Header with Parking Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-balance">Mis Parkings</h1>
                <p className="text-muted-foreground mt-2">Gestiona tus estacionamientos asignados</p>
              </div>

              <div className="flex items-center gap-4">
                <Select value={selectedParkingId || parkings[0]?.id} onValueChange={setSelectedParkingId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecciona un parking" />
                  </SelectTrigger>
                  <SelectContent>
                    {parkings.map((parking) => (
                      <SelectItem key={parking.id} value={parking.id}>
                        {parking.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={() => selectedParking && router.push(`/my-parkings/${selectedParking.id_parking}`)} disabled={!selectedParking}>
                  <Eye className="mr-2 h-4 w-4" />
                  Gestionar Parking
                </Button>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricsCard
                title="Mis Parkings"
                value={parkings.length}
                description="Estacionamientos asignados"
                icon={ParkingCircle}
              />
              <MetricsCard
                title="Plazas Totales"
                value={parkings.reduce((acc, p) => acc + (p.totalSpaces || 0), 0)}
                description="En todos mis parkings"
                icon={Car}
              />
              <MetricsCard
                title="Ingresos Totales"
                value={`S/. ${parkings.reduce((acc, p) => acc + (p.revenue || 0), 0).toFixed(2)}`}
                description="Este mes"
                icon={DollarSign}
              />
              <MetricsCard
                title="Reservas Hoy"
                value={0}
                description="En todos mis parkings"
                icon={Calendar}
              />
            </div>

            {/* Selected Parking Details */}
            {selectedParking && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Detalles de {selectedParking.name}</span>
                    {getStatusBadge(selectedParking.status || "active")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Ocupación Actual</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {selectedParking.occupiedSpaces ?? 0}/{selectedParking.totalSpaces ?? 0}
                        </span>
                        <Badge variant="outline">
                          {getOccupancyPercentage(selectedParking.occupiedSpaces ?? 0, selectedParking.totalSpaces || 1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Coordenadas</p>
                      <p className="text-sm">Lat: {selectedParking.latitud ?? "—"} / Lng: {selectedParking.longitud ?? "—"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Ingresos del Mes</p>
                      <p className="text-2xl font-bold">S/. {(selectedParking.revenue || 0).toFixed(2)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Ocupación Promedio</p>
                      <p className="text-2xl font-bold">—</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-2">Dirección</p>
                    <p className="font-medium">{selectedParking.address}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Parkings List */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Mis Parkings</CardTitle>
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
                          <TableCell>{getStatusBadge(parking.status || "active")}</TableCell>
                          <TableCell>S/. {(parking.revenue || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => openViewDialog(parking)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => openEditDialog(parking)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openDeleteDialog(parking)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Diálogo editar */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar parking</DialogTitle>
                  <DialogDescription>Modifica los datos básicos de tu parking.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData(v => ({ ...v, name: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Textarea id="address" value={formData.address} onChange={e => setFormData(v => ({ ...v, address: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="totalSpaces">Capacidad Total</Label>
                    <Input id="totalSpaces" type="number" value={formData.totalSpaces} onChange={e => setFormData(v => ({ ...v, totalSpaces: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-lat">Latitud</Label>
                      <Input
                        id="edit-lat"
                        type="number"
                        step="any"
                        value={formData.lat}
                        onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                        placeholder="-11.985608"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-lng">Longitud</Label>
                      <Input
                        id="edit-lng"
                        type="number"
                        step="any"
                        value={formData.lng}
                        onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                        placeholder="-77.072030"
                      />
                    </div>
                  </div>
                  <div className="rounded-md border overflow-hidden" style={{ height: '300px' }}>
                    <LeafletMapPicker
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                  <Button onClick={handleEdit} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Diálogo baja lógica */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Dar de baja parking</DialogTitle>
                  <DialogDescription>Esta acción deshabilita el parking sin eliminarlo físicamente.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div>
                    <Label htmlFor="reason">Motivo (opcional)</Label>
                    <Textarea id="reason" value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Ej. Mantenimiento preventivo" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>Dar de baja</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Diálogo ver detalle */}
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
          </div>
        </div>
    </AuthGuard>
  )
}
