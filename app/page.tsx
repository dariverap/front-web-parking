"use client"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { MetricsCard } from "@/components/metrics-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, ParkingCircle, DollarSign, Calendar, TrendingUp, Users } from "lucide-react"
import { useAuth } from "@/components/auth-guard"

function DashboardContent() {
  const { user } = useAuth()

  if (!user) return null

  const isAdminGeneral = (user as any).rol === "admin_general"
  const isEmpleado = (user as any).rol === "empleado"

  let metrics: {
    parkings: { value: string; description: string }
    occupancy: { value: string; description: string }
    revenue: { value: string; description: string }
    reservations: { value: string; description: string }
  }

  if (isAdminGeneral) {
    metrics = {
      parkings: { value: "12", description: "Total de estacionamientos" },
      occupancy: { value: "78%", description: "Promedio de ocupación" },
      revenue: { value: "S/. 24,580", description: "Ingresos del mes actual" },
      reservations: { value: "156", description: "Reservas para hoy" },
    }
  } else if (isEmpleado) {
    metrics = {
      parkings: { value: "1", description: "Mi estacionamiento" },
      occupancy: { value: "85%", description: "Ocupación actual" },
      revenue: { value: "S/. 1,240", description: "Cobros de hoy" },
      reservations: { value: "23", description: "Reservas pendientes" },
    }
  } else {
    metrics = {
      parkings: { value: (((user as any).parkings?.length || 0) as number).toString(), description: "Mis estacionamientos" },
      occupancy: { value: "82%", description: "Ocupación promedio" },
      revenue: { value: "S/. 2,140", description: "Mis ingresos del mes" },
      reservations: { value: "43", description: "Mis reservas hoy" },
    }
  }

  return (
    <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs items={[{ label: "Dashboard" }]} />

          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-balance">
                {isAdminGeneral ? "Dashboard Principal" : isEmpleado ? "Panel de Operaciones" : "Mi Dashboard"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isAdminGeneral
                  ? "Resumen general del sistema de estacionamientos"
                  : isEmpleado
                    ? "Gestiona las operaciones diarias de tu estacionamiento"
                    : "Resumen de tus estacionamientos asignados"}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricsCard
                title={isAdminGeneral ? "Parkings Activos" : isEmpleado ? "Mi Parking" : "Mis Parkings"}
                value={metrics.parkings.value}
                description={metrics.parkings.description}
                icon={ParkingCircle}
                trend={{ value: 8.2, isPositive: true }}
              />
              <MetricsCard
                title="Ocupación"
                value={metrics.occupancy.value}
                description={metrics.occupancy.description}
                icon={Car}
                trend={{ value: 2.1, isPositive: true }}
              />
              <MetricsCard
                title={isEmpleado ? "Cobros de Hoy" : "Ingresos"}
                value={metrics.revenue.value}
                description={metrics.revenue.description}
                icon={DollarSign}
                trend={{ value: 12.5, isPositive: true }}
              />
              <MetricsCard
                title="Reservas"
                value={metrics.reservations.value}
                description={metrics.reservations.description}
                icon={Calendar}
                trend={{ value: -3.2, isPositive: false }}
              />
            </div>

            {/* Charts and Tables Section */}
            <div className="grid gap-6 lg:grid-cols-2">
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "Nueva reserva", parking: "Parking Centro", time: "Hace 5 min" },
                      { action: "Vehículo salió", parking: "Parking Norte", time: "Hace 12 min" },
                      { action: "Pago procesado", parking: "Parking Centro", time: "Hace 18 min" },
                      { action: "Nueva reserva", parking: "Parking Sur", time: "Hace 25 min" },
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.parking}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
  )
}

export default function Dashboard() {
  return <DashboardContent />
}
