"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { MetricsCard } from "@/components/metrics-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, ParkingCircle, DollarSign, Calendar, TrendingUp, ArrowLeft, MapPin, Settings } from "lucide-react"

// Mock data for specific parking
const mockParkingData = {
  "1": {
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
    openingHours: "24 horas",
    phone: "+34 91 123 4567",
  },
  "2": {
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
    openingHours: "06:00 - 24:00",
    phone: "+34 91 987 6543",
  },
}

const mockReservations = [
  {
    id: "1",
    customerName: "Juan Pérez",
    space: "A-15",
    startTime: "14:30",
    endTime: "18:00",
    status: "active",
    amount: 8.75,
  },
  {
    id: "2",
    customerName: "María García",
    space: "B-22",
    startTime: "09:15",
    endTime: "17:30",
    status: "completed",
    amount: 16.5,
  },
  {
    id: "3",
    customerName: "Carlos López",
    space: "C-08",
    startTime: "16:00",
    endTime: "20:00",
    status: "pending",
    amount: 10.0,
  },
]

const mockSpaces = Array.from({ length: 20 }, (_, i) => ({
  id: `space-${i + 1}`,
  number: `${String.fromCharCode(65 + Math.floor(i / 10))}-${String(i + 1).padStart(2, "0")}`,
  status: Math.random() > 0.3 ? "occupied" : "available",
  vehiclePlate:
    Math.random() > 0.5
      ? `${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, "0")}`
      : null,
  entryTime: Math.random() > 0.5 ? "14:30" : null,
}))

export default function ParkingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const parkingId = params.id as string
  const [activeTab, setActiveTab] = useState("overview")

  const parking = mockParkingData[parkingId as keyof typeof mockParkingData]

  if (!parking) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar userRole="admin_parking" />
        <main className="flex-1 ml-0 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Parking no encontrado</h1>
            <p className="text-muted-foreground mb-4">El parking solicitado no existe o no tienes acceso.</p>
            <Button onClick={() => router.push("/my-parkings")}>Volver a Mis Parkings</Button>
          </div>
        </main>
      </div>
    )
  }

  const getOccupancyPercentage = (occupied: number, total: number) => {
    return Math.round((occupied / total) * 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activa</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completada</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSpaceStatusBadge = (status: string) => {
    switch (status) {
      case "occupied":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ocupada</Badge>
      case "available":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Libre</Badge>
      case "reserved":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Reservada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole="admin_parking" />

      <main className="flex-1 ml-0 md:ml-64 overflow-auto">
        <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs items={[{ label: "Mis Parkings", href: "/my-parkings" }, { label: parking.name }]} />

          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/my-parkings")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-balance">{parking.name}</h1>
                  <p className="text-muted-foreground mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {parking.address}
                  </p>
                </div>
              </div>

              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Button>
            </div>

            {/* Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricsCard
                title="Ocupación Actual"
                value={`${parking.occupiedSpaces}/${parking.totalSpaces}`}
                description={`${getOccupancyPercentage(parking.occupiedSpaces, parking.totalSpaces)}% ocupado`}
                icon={Car}
                trend={{ value: 5.2, isPositive: true }}
              />
              <MetricsCard
                title="Plazas Libres"
                value={parking.totalSpaces - parking.occupiedSpaces}
                description="Disponibles ahora"
                icon={ParkingCircle}
              />
              <MetricsCard
                title="Ingresos Hoy"
                value={`S/. ${(parking.revenue * 0.1).toFixed(2)}`}
                description="Ingresos del día"
                icon={DollarSign}
                trend={{ value: 12.3, isPositive: true }}
              />
              <MetricsCard
                title="Reservas Hoy"
                value={parking.todayReservations}
                description="Reservas activas"
                icon={Calendar}
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="spaces">Plazas</TabsTrigger>
                <TabsTrigger value="reservations">Reservas</TabsTrigger>
                <TabsTrigger value="analytics">Análisis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información del Parking</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Horario</p>
                          <p className="font-medium">{parking.openingHours}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                          <p className="font-medium">{parking.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tarifa por Hora</p>
                          <p className="font-medium">S/. {parking.hourlyRate}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Ocupación Promedio</p>
                          <p className="font-medium">{parking.avgOccupancy}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Ocupación por Horas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Gráfico de ocupación por horas
                        <br />
                        (Integrar con biblioteca de gráficos)
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="spaces" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estado de las Plazas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plaza</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Hora de Entrada</TableHead>
                            <TableHead>Tiempo Transcurrido</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockSpaces.map((space) => (
                            <TableRow key={space.id}>
                              <TableCell className="font-medium">{space.number}</TableCell>
                              <TableCell>{getSpaceStatusBadge(space.status)}</TableCell>
                              <TableCell>{space.vehiclePlate || "-"}</TableCell>
                              <TableCell>{space.entryTime || "-"}</TableCell>
                              <TableCell>{space.entryTime ? "2h 15min" : "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reservations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reservas del Día</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Plaza</TableHead>
                            <TableHead>Hora Inicio</TableHead>
                            <TableHead>Hora Fin</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Importe</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockReservations.map((reservation) => (
                            <TableRow key={reservation.id}>
                              <TableCell className="font-medium">{reservation.customerName}</TableCell>
                              <TableCell>{reservation.space}</TableCell>
                              <TableCell>{reservation.startTime}</TableCell>
                              <TableCell>{reservation.endTime}</TableCell>
                              <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                              <TableCell>S/. {reservation.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ingresos Mensuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Gráfico de ingresos mensuales
                        <br />
                        (Integrar con biblioteca de gráficos)
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estadísticas de Uso</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Tiempo promedio de estancia</span>
                        <span className="font-bold">2h 45min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Rotación diaria</span>
                        <span className="font-bold">3.2 veces</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Hora pico</span>
                        <span className="font-bold">14:00 - 16:00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Satisfacción del cliente</span>
                        <span className="font-bold">4.7/5</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
