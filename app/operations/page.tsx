"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Car, Clock, Search, RefreshCw, CheckCircle, AlertTriangle, Eye, Edit } from "lucide-react"

const mockParkingSpaces = [
  {
    id: "A001",
    level: "Planta Baja",
    zone: "A",
    status: "occupied",
    vehiclePlate: "1234ABC",
    entryTime: "2024-01-15 08:30",
    customerName: "Juan García",
    customerPhone: "+34 666 123 456",
    reservationId: "R001",
    notes: "",
  },
  {
    id: "A002",
    level: "Planta Baja",
    zone: "A",
    status: "available",
    vehiclePlate: "",
    entryTime: "",
    customerName: "",
    customerPhone: "",
    reservationId: "",
    notes: "",
  },
  {
    id: "A003",
    level: "Planta Baja",
    zone: "A",
    status: "reserved",
    vehiclePlate: "",
    entryTime: "",
    customerName: "María López",
    customerPhone: "+34 666 789 012",
    reservationId: "R002",
    notes: "Reserva para las 14:00",
  },
  {
    id: "B001",
    level: "Planta 1",
    zone: "B",
    status: "maintenance",
    vehiclePlate: "",
    entryTime: "",
    customerName: "",
    customerPhone: "",
    reservationId: "",
    notes: "Reparación de sensor",
  },
  {
    id: "B002",
    level: "Planta 1",
    zone: "B",
    status: "occupied",
    vehiclePlate: "5678DEF",
    entryTime: "2024-01-15 10:15",
    customerName: "Carlos Ruiz",
    customerPhone: "+34 666 345 678",
    reservationId: "",
    notes: "",
  },
]

const mockReservations = [
  {
    id: "R003",
    customerName: "Ana Martín",
    customerPhone: "+34 666 901 234",
    vehiclePlate: "9012GHI",
    reservedSpace: "A004",
    reservationTime: "2024-01-15 16:00",
    duration: "2 horas",
    status: "pending",
    notes: "Cliente VIP",
  },
  {
    id: "R004",
    customerName: "Pedro Sánchez",
    customerPhone: "+34 666 567 890",
    vehiclePlate: "3456JKL",
    reservedSpace: "B003",
    reservationTime: "2024-01-15 18:30",
    duration: "1 hora",
    status: "confirmed",
    notes: "",
  },
]

function OperationsPageContent() {
  const [spaces, setSpaces] = useState(mockParkingSpaces)
  const [reservations, setReservations] = useState(mockReservations)
  const [filteredSpaces, setFilteredSpaces] = useState(mockParkingSpaces)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [selectedSpace, setSelectedSpace] = useState<any>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    status: "",
    vehiclePlate: "",
    customerName: "",
    customerPhone: "",
    notes: "",
  })

  const applyFilters = () => {
    let filtered = spaces

    if (searchTerm) {
      filtered = filtered.filter(
        (space) =>
          space.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          space.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          space.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((space) => space.status === statusFilter)
    }

    if (zoneFilter !== "all") {
      filtered = filtered.filter((space) => space.zone === zoneFilter)
    }

    setFilteredSpaces(filtered)
  }

  const handleStatusChange = (spaceId: string, newStatus: string) => {
    const updatedSpaces = spaces.map((space) => {
      if (space.id === spaceId) {
        const updatedSpace = { ...space, status: newStatus }

        // Clear vehicle data when marking as available or maintenance
        if (newStatus === "available" || newStatus === "maintenance") {
          updatedSpace.vehiclePlate = ""
          updatedSpace.entryTime = ""
          updatedSpace.customerName = ""
          updatedSpace.customerPhone = ""
          updatedSpace.reservationId = ""
        }

        return updatedSpace
      }
      return space
    })

    setSpaces(updatedSpaces)
    setFilteredSpaces(updatedSpaces)
  }

  const handleCheckIn = () => {
    const updatedSpaces = spaces.map((space) => {
      if (space.id === selectedSpace.id) {
        return {
          ...space,
          status: "occupied",
          vehiclePlate: formData.vehiclePlate,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          entryTime: new Date().toLocaleString(),
          notes: formData.notes,
        }
      }
      return space
    })

    setSpaces(updatedSpaces)
    setFilteredSpaces(updatedSpaces)
    setIsCheckInDialogOpen(false)
    setFormData({ status: "", vehiclePlate: "", customerName: "", customerPhone: "", notes: "" })
  }

  const handleEdit = () => {
    const updatedSpaces = spaces.map((space) => {
      if (space.id === selectedSpace.id) {
        return {
          ...space,
          ...formData,
        }
      }
      return space
    })

    setSpaces(updatedSpaces)
    setFilteredSpaces(updatedSpaces)
    setIsEditDialogOpen(false)
  }

  const openDetailsDialog = (space: any) => {
    setSelectedSpace(space)
    setIsDetailsDialogOpen(true)
  }

  const openEditDialog = (space: any) => {
    setSelectedSpace(space)
    setFormData({
      status: space.status,
      vehiclePlate: space.vehiclePlate,
      customerName: space.customerName,
      customerPhone: space.customerPhone,
      notes: space.notes,
    })
    setIsEditDialogOpen(true)
  }

  const openCheckInDialog = (space: any) => {
    setSelectedSpace(space)
    setFormData({ status: "", vehiclePlate: "", customerName: "", customerPhone: "", notes: "" })
    setIsCheckInDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Disponible</Badge>
      case "occupied":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ocupado</Badge>
      case "reserved":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Reservado</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Mantenimiento</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getReservationStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmada</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "occupied":
        return <Car className="h-4 w-4 text-red-600" />
      case "reserved":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "maintenance":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  return (
    <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs items={[{ label: "Operaciones" }]} />

          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-balance">Panel de Operaciones</h1>
                <p className="text-muted-foreground mt-2">Gestiona los espacios y operaciones del parking</p>
              </div>

              <Button onClick={() => applyFilters()} className="bg-blue-600 hover:bg-blue-700 text-white">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Espacios</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{spaces.length}</div>
                  <p className="text-xs text-muted-foreground">Espacios totales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {spaces.filter((s) => s.status === "available").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Espacios libres</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocupados</CardTitle>
                  <Car className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {spaces.filter((s) => s.status === "occupied").length}
                  </div>
                  <p className="text-xs text-muted-foreground">En uso</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reservados</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {spaces.filter((s) => s.status === "reserved").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Reservas activas</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por espacio, matrícula o cliente..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        applyFilters()
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value)
                      applyFilters()
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="available">Disponibles</SelectItem>
                      <SelectItem value="occupied">Ocupados</SelectItem>
                      <SelectItem value="reserved">Reservados</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={zoneFilter}
                    onValueChange={(value) => {
                      setZoneFilter(value)
                      applyFilters()
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filtrar por zona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las zonas</SelectItem>
                      <SelectItem value="A">Zona A</SelectItem>
                      <SelectItem value="B">Zona B</SelectItem>
                      <SelectItem value="C">Zona C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Spaces Table */}
            <Card>
              <CardHeader>
                <CardTitle>Espacios de Parking ({filteredSpaces.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Espacio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Hora Entrada</TableHead>
                        <TableHead>Acciones Rápidas</TableHead>
                        <TableHead className="text-right">Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSpaces.map((space) => (
                        <TableRow key={space.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(space.status)}
                              <div>
                                <div className="font-medium">{space.id}</div>
                                <div className="text-sm text-muted-foreground">
                                  {space.level} - Zona {space.zone}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(space.status)}</TableCell>
                          <TableCell>
                            {space.vehiclePlate ? (
                              <Badge variant="outline" className="font-mono">
                                {space.vehiclePlate}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {space.customerName ? (
                              <div>
                                <div className="font-medium text-sm">{space.customerName}</div>
                                <div className="text-xs text-muted-foreground">{space.customerPhone}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {space.entryTime || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {space.status === "available" && (
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                  onClick={() => openCheckInDialog(space)}
                                >
                                  Check-in
                                </Button>
                              )}
                              {space.status === "occupied" && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                  onClick={() => handleStatusChange(space.id, "available")}
                                >
                                  Check-out
                                </Button>
                              )}
                              {space.status === "maintenance" && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                  onClick={() => handleStatusChange(space.id, "available")}
                                >
                                  Reparado
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => openDetailsDialog(space)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-700"
                                onClick={() => openEditDialog(space)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Reservations Table */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reserva</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Espacio</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">{reservation.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{reservation.customerName}</div>
                              <div className="text-xs text-muted-foreground">{reservation.customerPhone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {reservation.vehiclePlate}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{reservation.reservedSpace}</TableCell>
                          <TableCell className="text-sm">{reservation.reservationTime}</TableCell>
                          <TableCell className="text-sm">{reservation.duration}</TableCell>
                          <TableCell>{getReservationStatusBadge(reservation.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles del Espacio {selectedSpace?.id}</DialogTitle>
            <DialogDescription>Información completa del espacio de parking</DialogDescription>
          </DialogHeader>
          {selectedSpace && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Ubicación</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSpace.level} - Zona {selectedSpace.zone}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedSpace.status)}</div>
                </div>
              </div>
              {selectedSpace.vehiclePlate && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Matrícula</Label>
                    <p className="text-sm font-mono">{selectedSpace.vehiclePlate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Hora de Entrada</Label>
                    <p className="text-sm text-muted-foreground">{selectedSpace.entryTime}</p>
                  </div>
                </div>
              )}
              {selectedSpace.customerName && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Cliente</Label>
                    <p className="text-sm">{selectedSpace.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Teléfono</Label>
                    <p className="text-sm text-muted-foreground">{selectedSpace.customerPhone}</p>
                  </div>
                </div>
              )}
              {selectedSpace.notes && (
                <div>
                  <Label className="text-sm font-medium">Notas</Label>
                  <p className="text-sm text-muted-foreground">{selectedSpace.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Check-in Espacio {selectedSpace?.id}</DialogTitle>
            <DialogDescription>Registra la entrada de un vehículo</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vehiclePlate">Matrícula del Vehículo</Label>
              <Input
                id="vehiclePlate"
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                placeholder="1234ABC"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerName">Nombre del Cliente</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerPhone">Teléfono</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+34 666 123 456"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckInDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckIn} className="bg-blue-600 hover:bg-blue-700">
              Confirmar Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Espacio {selectedSpace?.id}</DialogTitle>
            <DialogDescription>Modifica la información del espacio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="occupied">Ocupado</SelectItem>
                  <SelectItem value="reserved">Reservado</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-vehiclePlate">Matrícula</Label>
              <Input
                id="edit-vehiclePlate"
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-customerName">Cliente</Label>
              <Input
                id="edit-customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-customerPhone">Teléfono</Label>
              <Input
                id="edit-customerPhone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function OperationsPage() {
  return (
    <AuthGuard allowedRoles={["empleado"]}>
      <OperationsPageContent />
    </AuthGuard>
  )
}
