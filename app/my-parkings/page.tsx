"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { MetricsCard } from "@/components/metrics-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, ParkingCircle, DollarSign, Calendar, Eye, Clock } from "lucide-react"
import { AuthGuard, useAuth } from "@/components/auth-guard"

// Mock data for admin_parking user
const mockUserParkings = [
  {
    id: "1",
    name: "Parking Centro Comercial",
    address: "Av. Principal 123, Madrid",
    totalSpaces: 150,
    occupiedSpaces: 120,
    hourlyRate: 2.5,
    status: "active",
    revenue: 1250.75,
    todayReservations: 25,
    avgOccupancy: 78,
  },
  {
    id: "2",
    name: "Parking Norte Plaza",
    address: "Calle Norte 45, Madrid",
    totalSpaces: 80,
    occupiedSpaces: 65,
    hourlyRate: 2.0,
    status: "active",
    revenue: 890.25,
    todayReservations: 18,
    avgOccupancy: 82,
  },
]

// Mock recent activity
const mockRecentActivity = [
  { id: "1", action: "Vehículo entró", space: "A-15", time: "Hace 5 min", parkingId: "1" },
  { id: "2", action: "Reserva confirmada", space: "B-22", time: "Hace 12 min", parkingId: "2" },
  { id: "3", action: "Vehículo salió", space: "C-08", time: "Hace 18 min", parkingId: "1" },
  { id: "4", action: "Pago procesado", space: "A-33", time: "Hace 25 min", parkingId: "2" },
]

export default function MyParkingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedParkingId, setSelectedParkingId] = useState<string>("")
  // Preferir parkings del usuario si vienen del backend; fallback a mocks
  const effectiveParkings = Array.isArray((user as any)?.parkings) && (user as any)?.parkings?.length
    ? mockUserParkings.filter(p => (user as any).parkings.includes(p.id))
    : mockUserParkings
  const [userParkings] = useState(effectiveParkings)

  // If user has only one parking, redirect to its dashboard
  useEffect(() => {
    if (userParkings.length === 1) {
      router.push(`/parking/${userParkings[0].id}`)
    }
  }, [userParkings, router])

  // If user has only one parking, show loading while redirecting
  if (userParkings.length === 1) {
    return (
      <AuthGuard allowedRoles={["admin_parking"]}>
        <div className="p-6 pt-16 md:pt-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirigiendo a tu parking...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const selectedParking = userParkings.find((p) => p.id === selectedParkingId) || userParkings[0]

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
                <Select value={selectedParkingId || userParkings[0]?.id} onValueChange={setSelectedParkingId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecciona un parking" />
                  </SelectTrigger>
                  <SelectContent>
                    {userParkings.map((parking) => (
                      <SelectItem key={parking.id} value={parking.id}>
                        {parking.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={() => router.push(`/parking/${selectedParking.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Dashboard
                </Button>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricsCard
                title="Mis Parkings"
                value={userParkings.length}
                description="Estacionamientos asignados"
                icon={ParkingCircle}
              />
              <MetricsCard
                title="Plazas Totales"
                value={userParkings.reduce((acc, p) => acc + p.totalSpaces, 0)}
                description="En todos mis parkings"
                icon={Car}
              />
              <MetricsCard
                title="Ingresos Totales"
                value={`€${userParkings.reduce((acc, p) => acc + p.revenue, 0).toFixed(2)}`}
                description="Este mes"
                icon={DollarSign}
              />
              <MetricsCard
                title="Reservas Hoy"
                value={userParkings.reduce((acc, p) => acc + p.todayReservations, 0)}
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
                    {getStatusBadge(selectedParking.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Ocupación Actual</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {selectedParking.occupiedSpaces}/{selectedParking.totalSpaces}
                        </span>
                        <Badge variant="outline">
                          {getOccupancyPercentage(selectedParking.occupiedSpaces, selectedParking.totalSpaces)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Tarifa por Hora</p>
                      <p className="text-2xl font-bold">€{selectedParking.hourlyRate}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Ingresos del Mes</p>
                      <p className="text-2xl font-bold">€{selectedParking.revenue.toFixed(2)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Ocupación Promedio</p>
                      <p className="text-2xl font-bold">{selectedParking.avgOccupancy}%</p>
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
                        <TableHead>Tarifa/Hora</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Ingresos</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userParkings.map((parking) => (
                        <TableRow key={parking.id}>
                          <TableCell className="font-medium">{parking.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{parking.address}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {parking.occupiedSpaces}/{parking.totalSpaces}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {getOccupancyPercentage(parking.occupiedSpaces, parking.totalSpaces)}%
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>€{parking.hourlyRate}</TableCell>
                          <TableCell>{getStatusBadge(parking.status)}</TableCell>
                          <TableCell>€{parking.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => router.push(`/parking/${parking.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentActivity.map((activity) => {
                    const parking = userParkings.find((p) => p.id === activity.parkingId)
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {parking?.name} - Plaza {activity.space}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </AuthGuard>
  )
}
