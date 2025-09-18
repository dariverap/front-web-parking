"use client"

import { useEffect, useMemo, useState } from "react"
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
import { listAllParkings, listParkingsByUser, createParking as apiCreateParking, updateParking as apiUpdateParking, assignAdminToParking as apiAssignAdminToParking, softDeleteParking as apiSoftDeleteParking, type ParkingRecord } from "@/lib/parkings"
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
  }>>([])
  const [admins, setAdmins] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedParking, setSelectedParking] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    totalSpaces: "",
    hourlyRate: "",
    adminId: "",
  })

  // Load data from API
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Fetch parkings based on role
        const apiParks = user?.rol === "admin_parking" && (user as any)?.id_usuario
          ? await listParkingsByUser((user as any).id_usuario)
          : await listAllParkings()
        // Only admin_general needs the list of potential admins
        const apiUsers = user?.rol === "admin_general" ? await listUsers() : []
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
        }))
        setParkings(mapped)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [user?.rol, (user as any)?.id_usuario])

  const handleCreate = async () => {
    // Crear vía API
    const payload = {
      nombre: formData.name,
      direccion: formData.address,
      capacidad_total: Number.parseInt(formData.totalSpaces),
      latitud: 0,
      longitud: 0,
      id_admin_asignado: formData.adminId || undefined,
    }
    const created = await apiCreateParking(payload)
    // Optimistic: refrescar lista
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
    }))
    setParkings(mapped)
    setIsCreateDialogOpen(false)
    setFormData({ name: "", address: "", totalSpaces: "", hourlyRate: "", adminId: "" })
  }

  const handleEdit = async () => {
    // Actualizar datos básicos
    await apiUpdateParking(selectedParking.id_parking || selectedParking.id, {
      nombre: formData.name,
      direccion: formData.address,
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
    }))
    setParkings(mapped)
    setIsEditDialogOpen(false)
    setSelectedParking(null)
  }

  const handleDelete = async () => {
    // Baja lógica (soft delete)
    await apiSoftDeleteParking(selectedParking.id_parking || selectedParking.id)
    // Actualizar estado local a inactivo y no eliminar fila
    setParkings(prev => prev.map(p =>
      p.id === selectedParking.id ? { ...p, status: "inactive" } : p
    ))
    setIsDeleteDialogOpen(false)
    setSelectedParking(null)
  }

  const openEditDialog = (parking: any) => {
    setSelectedParking(parking)
    setFormData({
      name: parking.name,
      address: parking.address || "",
      totalSpaces: String(parking.totalSpaces ?? ""),
      hourlyRate: String(parking.hourlyRate ?? ""),
      adminId: parking.id_admin || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (parking: any) => {
    setSelectedParking(parking)
    setIsDeleteDialogOpen(true)
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
                  <DialogContent className="sm:max-w-[500px]">
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
                        <Label htmlFor="hourlyRate">Tarifa/Hora (€)</Label>
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
                    €{parkings.reduce((acc, p) => acc + (p.revenue ?? 0), 0).toFixed(2)}
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
                        <TableHead>Tarifa/Hora</TableHead>
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
                          <TableCell>{parking.hourlyRate ? `€${parking.hourlyRate}` : "—"}</TableCell>
                          <TableCell>{getStatusBadge(parking.status || "active")}</TableCell>
                          <TableCell>{parking.adminName || "—"}</TableCell>
                          <TableCell>{typeof parking.revenue === "number" ? `€${parking.revenue.toFixed(2)}` : "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {user?.rol === "admin_general" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => openEditDialog(parking)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {user?.rol === "admin_general" && (
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
        <DialogContent className="sm:max-w-[520px]">
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
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-hourlyRate">Tarifa/Hora (€)</Label>
                <Input
                  id="edit-hourlyRate"
                  type="number"
                  step="0.1"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                />
              </div>
            </div>
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
            <DialogTitle>Dar de baja parking</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres dar de baja "{selectedParking?.name}"? Podrás restaurarlo más tarde.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Dar de baja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </>
  )
}
