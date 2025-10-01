"use client"

import { useEffect, useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, UserCheck, Search, Phone } from "lucide-react"
import { lettersOnly, digitsOnly, isValidName, isValidPhone } from "@/lib/validators"
import { useAuth } from "@/components/auth-guard"
import { listScopedEmployees, updateEmployee } from "@/lib/employees"
import { createEmployee, deleteEmployee } from "@/lib/employees"
import { assignParkingsToUser, removeParkingFromUser, getUser } from "@/lib/users"
import { listAllParkings, listParkingsByUser, type ParkingRecord } from "@/lib/parkings"
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast"

const mockEmployees = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan.perez@email.com",
    phone: "+34 666 901 234",
    position: "Operador de Parking",
    status: "active",
    assignedParkings: ["1"],
    parkingNames: ["Parking Centro"],
    shift: "morning",
    salary: "1800",
    hireDate: "2024-01-10",
    lastLogin: "2024-01-15 08:30",
    notes: "Empleado responsable y puntual",
  },
  {
    id: "2",
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "+34 666 567 890",
    position: "Supervisora",
    status: "inactive",
    assignedParkings: ["2"],
    parkingNames: ["Parking Norte"],
    shift: "afternoon",
    salary: "2200",
    hireDate: "2024-01-05",
    lastLogin: "2024-01-10 17:20",
    notes: "En licencia médica temporal",
  },
  {
    id: "3",
    name: "Carlos Martín",
    email: "carlos.martin@email.com",
    phone: "+34 666 234 567",
    position: "Operador de Parking",
    status: "active",
    assignedParkings: ["3"],
    parkingNames: ["Parking Sur"],
    shift: "night",
    salary: "1900",
    hireDate: "2023-12-15",
    lastLogin: "2024-01-15 22:15",
    notes: "Especialista en turno nocturno",
  },
  {
    id: "4",
    name: "Ana Rodríguez",
    email: "ana.rodriguez@email.com",
    phone: "+34 666 345 678",
    position: "Cajera",
    status: "active",
    assignedParkings: ["1", "2"],
    parkingNames: ["Parking Centro", "Parking Norte"],
    shift: "morning",
    salary: "1700",
    hireDate: "2024-01-08",
    lastLogin: "2024-01-15 09:45",
    notes: "Excelente atención al cliente",
  },
]

// Parkings se cargarán desde API

// UI simplificada: solo datos que existen en BD

function EmployeesPageContent() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([])
  const [parkings, setParkings] = useState<Array<{ id: string; name: string }>>([])
  const [searchTerm, setSearchTerm] = useState("")
  // Toast state
  const [toastOpen, setToastOpen] = useState(false)
  const [toastTitle, setToastTitle] = useState("")
  const [toastDesc, setToastDesc] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    assignedParkings: [] as string[],
    // UI-only fields eliminados
  })

  // Validaciones derivadas
  const validName = isValidName(formData.name)
  const validPhone = formData.phone === "" ? true : isValidPhone(formData.phone)
  const validEmail = (formData.email || "").includes("@")
  const canCreate = validName && validEmail && validPhone
  const canEdit = validName && validEmail && validPhone

  const showSuccess = (title: string, desc?: string) => { setToastTitle(title); setToastDesc(desc || ""); setToastOpen(true) }
  const showError = (title: string, desc?: string) => { setToastTitle(title); setToastDesc(desc || ""); setToastOpen(true) }

  // Load employees from API with scope by role
  useEffect(() => {
    const load = async () => {
      const apiEmployees = await listScopedEmployees()
      const mapped = apiEmployees.map((e: any) => ({
        id: e.id_usuario,
        id_usuario: e.id_usuario,
        name: `${e.nombre ?? ""} ${e.apellido ?? ""}`.trim(),
        email: e.email,
        phone: e.telefono ?? "",
        assignedParkings: (e.parkings || []).map((p: any) => String(p.id_parking)),
        parkingNames: (e.parkings || []).map((p: any) => p.nombre).filter(Boolean),
        lastLogin: "",
        raw: e,
      }))
      setEmployees(mapped)
      setFilteredEmployees(mapped)
      // Load available parkings based on role
      let parks: ParkingRecord[] = []
      if (user?.rol === "admin_parking" && (user as any)?.id_usuario) {
        parks = await listParkingsByUser((user as any).id_usuario)
      } else {
        parks = await listAllParkings()
      }
      setParkings(parks.map(p => ({ id: String(p.id_parking), name: p.nombre })))
    }
    void load()
  }, [user?.rol, (user as any)?.id_usuario])

  // Search filtering derived from source list to avoid stale state
  useEffect(() => {
    const term = (searchTerm || "").trim().toLowerCase()
    if (!term) {
      setFilteredEmployees(employees)
      return
    }
    const filtered = employees.filter((e) =>
      (e.name || "").toLowerCase().includes(term) || (e.email || "").toLowerCase().includes(term)
    )
    setFilteredEmployees(filtered)
  }, [searchTerm, employees])

  const handleCreate = async () => {
    // Nombre completo -> nombre, apellido
    const nombreCompleto = formData.name?.trim() || ""
    const parts = nombreCompleto.split(" ")
    const apellido = parts.length > 1 ? parts.slice(1).join(" ") : ""
    const nombre = parts[0] || nombreCompleto
    const parking_ids = formData.assignedParkings.map((id) => Number(id)).filter((n) => Number.isInteger(n))

    try {
      await createEmployee({ nombre, apellido, email: formData.email, telefono: formData.phone, parking_ids })
      showSuccess("Empleado creado", formData.email)
    } catch (e: any) {
      showError("Error al crear empleado", e?.response?.data?.message || e?.message)
      return
    }

    // Refresh list
    const apiEmployees = await listScopedEmployees()
    const mapped = apiEmployees.map((e: any) => ({
      id: e.id_usuario,
      id_usuario: e.id_usuario,
      name: `${e.nombre ?? ""} ${e.apellido ?? ""}`.trim(),
      email: e.email,
      phone: e.telefono ?? "",
      assignedParkings: (e.parkings || []).map((p: any) => String(p.id_parking)),
      parkingNames: (e.parkings || []).map((p: any) => p.nombre).filter(Boolean),
      lastLogin: "",
      raw: e,
    }))
    setEmployees(mapped)
    setFilteredEmployees(mapped)
    setIsCreateDialogOpen(false)
    setFormData({ name: "", email: "", phone: "", assignedParkings: [] })
  }

  const handleEdit = async () => {
    // Nombre completo -> nombre, apellido (split heurístico)
    const nombreCompleto = formData.name?.trim() || ""
    const parts = nombreCompleto.split(" ")
    const apellido = parts.length > 1 ? parts.slice(1).join(" ") : ""
    const nombre = parts[0] || nombreCompleto

    const id = selectedEmployee?.raw?.id_usuario || selectedEmployee?.id_usuario || selectedEmployee?.id
    if (!id) { showError("No se pudo determinar el ID del usuario a actualizar"); return }
    console.debug('updateEmployee -> id', id, { nombre, apellido, telefono: formData.phone })
    try {
      await updateEmployee(String(id), { nombre, apellido, telefono: formData.phone })
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404) {
        showError("Usuario no encontrado", "Puede haber sido eliminado o el ID es inválido")
        // Auto-refrescar lista y cerrar modal si el usuario no existe
        try {
          const apiEmployees = await listScopedEmployees()
          const mapped = apiEmployees.map((e: any) => ({
            id: e.id_usuario,
            id_usuario: e.id_usuario,
            name: `${e.nombre ?? ""} ${e.apellido ?? ""}`.trim(),
            email: e.email,
            phone: e.telefono ?? "",
            assignedParkings: (e.parkings || []).map((p: any) => String(p.id_parking)),
            parkingNames: (e.parkings || []).map((p: any) => p.nombre).filter(Boolean),
            lastLogin: "",
            raw: e,
          }))
          setEmployees(mapped)
          setFilteredEmployees(mapped)
        } catch {}
        setIsEditDialogOpen(false)
        setSelectedEmployee(null)
      } else if (status === 403) {
        showError("Sin permisos", e?.response?.data?.message || "No tienes permisos para editar este usuario")
      } else {
        showError("Error al actualizar empleado", e?.response?.data?.message || e?.message)
      }
      return
    }

    // Si es admin_general, aplicar cambios de asignaciones de parkings
    if (user?.rol === "admin_general") {
      const before: string[] = Array.isArray(selectedEmployee?.assignedParkings) ? selectedEmployee.assignedParkings : []
      const after: string[] = Array.isArray(formData.assignedParkings) ? formData.assignedParkings : []
      const toAdd = after.filter((p) => !before.includes(p)).map((p) => ({ id_parking: Number(p), rol_en_parking: 'empleado' as const }))
      const toRemove = before.filter((p) => !after.includes(p)).map((p) => Number(p))
      try {
        if (toAdd.length > 0) {
          await assignParkingsToUser(String(id), toAdd)
        }
        for (const pid of toRemove) {
          await removeParkingFromUser(String(id), pid)
        }
      } catch (e: any) {
        showError("Error al asignar parkings", e?.response?.data?.message || e?.message)
      }
    }

    // Refrescar lista desde API
    const apiEmployees = await listScopedEmployees()
    const mapped = apiEmployees.map((e: any) => ({
      id: e.id_usuario,
      id_usuario: e.id_usuario,
      name: `${e.nombre ?? ""} ${e.apellido ?? ""}`.trim(),
      email: e.email,
      phone: e.telefono ?? "",
      assignedParkings: (e.parkings || []).map((p: any) => String(p.id_parking)),
      parkingNames: (e.parkings || []).map((p: any) => p.nombre).filter(Boolean),
      lastLogin: "",
      raw: e,
    }))
    setEmployees(mapped)
    setFilteredEmployees(mapped)
    setIsEditDialogOpen(false)
    setSelectedEmployee(null)
    showSuccess("Empleado actualizado", undefined)
  }

  const handleDelete = async () => {
    const id = selectedEmployee?.raw?.id_usuario || selectedEmployee?.id_usuario || selectedEmployee?.id
    if (!id) { showError("No se pudo determinar el ID del usuario a eliminar"); return }
    console.debug('deleteEmployee -> id', id)
    try {
      await deleteEmployee(String(id))
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404) {
        showError("Usuario no encontrado", "Puede haber sido eliminado previamente")
      } else if (status === 403) {
        showError("Sin permisos", e?.response?.data?.message || "No tienes permisos para eliminar este usuario")
      } else {
        showError("Error al eliminar empleado", e?.response?.data?.message || e?.message)
      }
      return
    }
    const apiEmployees = await listScopedEmployees()
    const mapped = apiEmployees.map((e: any) => ({
      id: e.id_usuario,
      id_usuario: e.id_usuario,
      name: `${e.nombre ?? ""} ${e.apellido ?? ""}`.trim(),
      email: e.email,
      phone: e.telefono ?? "",
      assignedParkings: (e.parkings || []).map((p: any) => String(p.id_parking)),
      parkingNames: (e.parkings || []).map((p: any) => p.nombre).filter(Boolean),
      lastLogin: "",
      raw: e,
    }))
    setEmployees(mapped)
    setFilteredEmployees(mapped)
    setIsDeleteDialogOpen(false)
    setSelectedEmployee(null)
    showSuccess("Empleado eliminado", undefined)
  }

  const openEditDialog = async (employee: any) => {
    // Verificar existencia actual del usuario antes de abrir el modal
    const uid = employee?.raw?.id_usuario || employee?.id_usuario || employee?.id
    if (!uid) {
      showError("No se pudo determinar el ID del usuario a editar")
      return
    }
    try {
      await getUser(String(uid))
    } catch (e: any) {
      if (e?.response?.status === 404) {
        showError("Usuario no encontrado", "Puede haber sido eliminado")
        // Refrescar lista
        try {
          const apiEmployees = await listScopedEmployees()
          const mapped = apiEmployees.map((e: any) => ({
            id: e.id_usuario,
            id_usuario: e.id_usuario,
            name: `${e.nombre ?? ""} ${e.apellido ?? ""}`.trim(),
            email: e.email,
            phone: e.telefono ?? "",
            assignedParkings: (e.parkings || []).map((p: any) => String(p.id_parking)),
            parkingNames: (e.parkings || []).map((p: any) => p.nombre).filter(Boolean),
            lastLogin: "",
            raw: e,
          }))
          setEmployees(mapped)
          setFilteredEmployees(mapped)
        } catch {}
        return
      }
    }
    setSelectedEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      assignedParkings: employee.assignedParkings,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (employee: any) => {
    setSelectedEmployee(employee)
    setIsDeleteDialogOpen(true)
  }

  const handleParkingAssignment = (parkingId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        assignedParkings: [...formData.assignedParkings, parkingId],
      })
    } else {
      setFormData({
        ...formData,
        assignedParkings: formData.assignedParkings.filter((id) => id !== parkingId),
      })
    }
  }

  return (
    <ToastProvider>
    <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs items={[{ label: "Empleados" }]} />

          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-balance">Gestión de Empleados</h1>
                <p className="text-muted-foreground mt-2">Administra el personal de los estacionamientos</p>
              </div>
              {user?.rol === "admin_general" && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Empleado
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Empleado</DialogTitle>
                    <DialogDescription>Completa la información del nuevo empleado.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: lettersOnly(e.target.value) })}
                          placeholder="Nombre del empleado"
                        />
                        {!validName && formData.name !== "" && (
                          <p className="text-xs text-red-600">Solo letras y espacios (mín. 2 caracteres).</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="empleado@email.com"
                        />
                        {!validEmail && formData.email !== "" && (
                          <p className="text-xs text-red-600">Ingrese un email válido.</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: digitsOnly(e.target.value) })}
                          placeholder="+34 666 123 456"
                        />
                        {!validPhone && formData.phone !== "" && (
                          <p className="text-xs text-red-600">Ingrese solo números (6 a 15 dígitos).</p>
                        )}
                      </div>
                      {/* Campos UI no persistentes (puesto, turno, salario, fecha) eliminados */}
                    <div className="grid gap-2">
                      <Label>Parkings Asignados</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                        {parkings.map((parking: { id: string; name: string }) => (
                          <div key={parking.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`parking-${parking.id}`}
                              checked={formData.assignedParkings.includes(parking.id)}
                              onCheckedChange={(checked) => handleParkingAssignment(parking.id, checked as boolean)}
                            />
                            <Label htmlFor={`parking-${parking.id}`} className="text-sm">
                              {parking.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700" disabled={!canCreate}>
                      Crear Empleado
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              )}
            </div>

            {/* Filters (solo búsqueda por nombre/email) */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards (solo totales) */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employees.length}</div>
                  <p className="text-xs text-muted-foreground">Usuarios con rol empleado</p>
                </CardContent>
              </Card>
            </div>

            {/* Employees Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Empleados ({filteredEmployees.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Parkings</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-muted-foreground">{employee.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {employee.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">empleado</Badge>
                          </TableCell>
                          <TableCell>
                            {employee.parkingNames.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {employee.parkingNames.slice(0, 1).map((parking: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {parking}
                                  </Badge>
                                ))}
                                {employee.parkingNames.length > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{employee.parkingNames.length - 1}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Ninguno</span>
                            )}
                          </TableCell>
                          {/* Sin columna salario (no existe en BD) */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => openEditDialog(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {user?.rol === "admin_general" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => openDeleteDialog(employee)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription>Modifica la información del empleado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre Completo</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: lettersOnly(e.target.value) })}
                />
                {!validName && formData.name !== "" && (
                  <p className="text-xs text-red-600">Solo letras y espacios (mín. 2 caracteres).</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {!validEmail && formData.email !== "" && (
                  <p className="text-xs text-red-600">Ingrese un email válido.</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: digitsOnly(e.target.value) })}
                />
                {!validPhone && formData.phone !== "" && (
                  <p className="text-xs text-red-600">Ingrese solo números (6 a 15 dígitos).</p>
                )}
              </div>
            </div>
            {user?.rol === "admin_general" && (
              <div className="grid gap-2">
                <Label>Parkings Asignados</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {parkings.map((parking: { id: string; name: string }) => (
                    <div key={parking.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-parking-${parking.id}`}
                        checked={formData.assignedParkings.includes(parking.id)}
                        onCheckedChange={(checked) => handleParkingAssignment(parking.id, checked as boolean)}
                      />
                      <Label htmlFor={`edit-parking-${parking.id}`} className="text-sm">
                        {parking.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Notas eliminadas (no existe en BD) */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={!canEdit}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Empleado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar a "{selectedEmployee?.name}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast UI */}
      <Toast open={toastOpen} onOpenChange={setToastOpen}>
        <ToastTitle>{toastTitle}</ToastTitle>
        {toastDesc && <ToastDescription>{toastDesc}</ToastDescription>}
      </Toast>
      <ToastViewport />
    </div>
    </ToastProvider>
  )
}

export default function EmployeesPage() {
  return (
    <AuthGuard allowedRoles={["admin_general","admin_parking"]}>
      <EmployeesPageContent />
    </AuthGuard>
  )
}
