"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ParkingForm } from "@/components/parking-form"

export default function CreateParkingPage() {
  const router = useRouter()

  const handleSubmit = (data: any) => {
    // In a real app, this would make an API call
    console.log("Creating parking:", data)
    // Simulate success and redirect
    router.push("/parkings")
  }

  const handleCancel = () => {
    router.push("/parkings")
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole="admin_general" />

      <main className="flex-1 ml-0 md:ml-64 overflow-auto">
        <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs
            items={[{ label: "Gestión de Parkings", href: "/parkings" }, { label: "Crear Nuevo Parking" }]}
          />

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-balance">Crear Nuevo Parking</h1>
              <p className="text-muted-foreground mt-2">
                Completa la información para agregar un nuevo estacionamiento
              </p>
            </div>

            <ParkingForm onSubmit={handleSubmit} onCancel={handleCancel} />
          </div>
        </div>
      </main>
    </div>
  )
}
