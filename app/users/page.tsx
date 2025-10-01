"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Plus, Edit, Trash2, Users, Shield, UserCheck, Search } from "lucide-react"
import { listUsers, toggleBlockUser, deleteUser, getUserParkings, assignParkingsToUser, removeParkingFromUser, type UserRecord, updateUser, type ParkingAssignment } from "@/lib/users"
import { lettersOnly, digitsOnly, isValidName, isValidPhone, isValidEmail } from "@/lib/validators"
import { listAllParkings, type ParkingRecord } from "@/lib/parkings"
import { register } from "@/lib/auth"

type UIUser = {
  id: string
  name: string
  email: string
  role: "admin_general" | "admin_parking" | "empleado" | "cliente"
  status: "active" | "inactive" | "deleted"
  assignedParkings: string[]
  parkingNames: string[]
  phone?: string
}

function UsersPageContent() {
  const [users, setUsers] = useState<UIUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UIUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "active",
    assignedParkings: [] as string[],
  })
  const [parkings, setParkings] = useState<ParkingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|undefined>(undefined)

  // Derived validations
  const validName = isValidName(formData.name)
  const validPhone = formData.phone === "" ? true : isValidPhone(formData.phone)
  const validEmail = isValidEmail(formData.email)
  const canCreate = validName && validEmail && validPhone && !!formData.role
  const canEdit = validName && validEmail && validPhone && !!formData.role

  // Cargar usuarios y parkings
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Hydrate quickly from sessionStorage cache to avoid empty UI while fetching
        if (typeof window !== "undefined") {
          const cached = sessionStorage.getItem("users_cache")
          if (cached) {
            try {
              const parsed = JSON.parse(cached)
              if (Array.isArray(parsed)) {
                const mappedQuick: UIUser[] = parsed.map((u: any) => ({
                  id: u.id || u.id_usuario,
                  name: [u.nombre, u.apellido].filter(Boolean).join(" ") || u.nombre || u.apellido || "(Sin nombre)",
                  email: u.email || "",
                  role: (u.rol || u.role || "empleado").toLowerCase(),
                  status: u.deleted_at ? "deleted" : (u.bloqueado ? "inactive" : "active"),
                  assignedParkings: [],
                  parkingNames: [],
                  phone: u.telefono,
                }))
                setUsers(mappedQuick)
                setFilteredUsers(mappedQuick)
              }
            } catch {}
          }
        }
        const [apiUsers, apiParkings] = await Promise.all([listUsers(), listAllParkings()])
        setParkings(apiParkings)
        // Mapear usuarios del backend a UI
        const mapped: UIUser[] = apiUsers.map((u: any) => {
          const id = u.id || u.id_usuario
          const name = [u.nombre, u.apellido].filter(Boolean).join(" ") || u.nombre || u.apellido || "(Sin nombre)"
          const email = u.email || ""
          const role = (u.rol || u.role || "empleado").toLowerCase()
          const status = u.deleted_at ? "deleted" : (u.bloqueado ? "inactive" : "active")
          return {
            id,
            name,
            email,
            role,
            status,
            assignedParkings: [],
            parkingNames: [],
            phone: u.telefono,
          }
        })
        setUsers(mapped)
        setFilteredUsers(mapped)
        if (typeof window !== "undefined") {
          try { sessionStorage.setItem("users_cache", JSON.stringify(apiUsers)) } catch {}
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || "Error cargando usuarios")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const applyFilters = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter, statusFilter, users])

  const handleCreate = async () => {
    try {
      // 1) Registrar como cliente
      const nombre = formData.name.split(" ").slice(0, -1).join(" ") || formData.name
      const apellido = formData.name.split(" ").slice(-1).join(" ") || ""
      const basePassword = Math.random().toString(36).slice(-8) // generar una clave temporal
      await register({ nombre, apellido, email: formData.email, telefono: formData.phone, password: basePassword, rol: "cliente" as any })

      // Recargar lista para obtener el id del nuevo usuario
      const refreshed = await listUsers()
      // Encontrar por email
      const created = refreshed.find((u: any) => (u.email || "").toLowerCase() === formData.email.toLowerCase())
      if (!created) throw new Error("No se pudo localizar el usuario recién creado")
      const createdId = String(created.id || created.id_usuario)

      // 2) Si el rol final no es cliente, actualizar rol y teléfono
      if (formData.role && formData.role !== "cliente") {
        await updateUser(createdId, {
          rol: formData.role as any,
          telefono: formData.phone,
        })
      }

      // 3) Si rol es admin_parking o empleado y hay parkings, asignar
      if ((formData.role === "admin_parking" || formData.role === "empleado") && formData.assignedParkings.length > 0) {
        const roleInParking: 'admin_parking' | 'empleado' = formData.role === 'admin_parking' ? 'admin_parking' : 'empleado'
        const assignments: ParkingAssignment[] = formData.assignedParkings.map((id) => ({ id_parking: Number(id), rol_en_parking: roleInParking }))
        await assignParkingsToUser(createdId, assignments)
      }

      // Refrescar UI
      const refreshed2 = await listUsers()
      const mapped: UIUser[] = refreshed2.map((u: any) => ({
        id: u.id || u.id_usuario,
        name: [u.nombre, u.apellido].filter(Boolean).join(" ") || u.nombre || u.apellido || "(Sin nombre)",
        email: u.email || "",
        role: (u.rol || u.role || "empleado").toLowerCase(),
        status: u.deleted_at ? "deleted" : (u.bloqueado ? "inactive" : "active"),
        assignedParkings: [],
        parkingNames: [],
        phone: u.telefono,
      }))
      setUsers(mapped)
      setFilteredUsers(mapped)
      setIsCreateDialogOpen(false)
      setFormData({ name: "", email: "", phone: "", role: "", status: "active", assignedParkings: [] })
    } catch (e) {
      // TODO: toast de error
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return
    try {
      const payload: Partial<UserRecord> = {
        nombre: formData.name.split(" ").slice(0, -1).join(" ") || formData.name,
        apellido: formData.name.split(" ").slice(-1).join(" ") || "",
        email: formData.email,
        telefono: formData.phone,
        rol: formData.role as any,
      }
      await updateUser(selectedUser.id, payload)
      // Sincronizar asignaciones: calcular diferencias
      if (formData.role === "admin_parking" || formData.role === "empleado") {
        const assignedNow = new Set(formData.assignedParkings.map((s) => Number(s)))
        try {
          const current = await getUserParkings(selectedUser.id)
          const currentIds: number[] = Array.isArray(current) ? current.map((p: any) => Number(p.id_parking || p.id)) : []
          const currentSet = new Set(currentIds)
          const toAdd: number[] = []
          const toRemove: number[] = []
          assignedNow.forEach((id) => { if (!currentSet.has(id)) toAdd.push(id) })
          currentIds.forEach((id) => { if (!assignedNow.has(id)) toRemove.push(id) })
          if (toAdd.length > 0) {
            const roleInParking: 'admin_parking' | 'empleado' = formData.role === 'admin_parking' ? 'admin_parking' : 'empleado'
            const assignments: ParkingAssignment[] = toAdd.map((id) => ({ id_parking: id, rol_en_parking: roleInParking }))
            await assignParkingsToUser(selectedUser.id, assignments)
          }
          for (const idp of toRemove) await removeParkingFromUser(selectedUser.id, idp)
        } catch (_) {}
      }
      const refreshed = await listUsers()
      const mapped: UIUser[] = refreshed.map((u: any) => ({
        id: u.id || u.id_usuario,
        name: [u.nombre, u.apellido].filter(Boolean).join(" ") || u.nombre || u.apellido || "(Sin nombre)",
        email: u.email || "",
        role: (u.rol || u.role || "empleado").toLowerCase(),
        status: u.deleted_at ? "deleted" : (u.bloqueado ? "inactive" : "active"),
        assignedParkings: [],
        parkingNames: [],
        phone: u.telefono,
      }))
      setUsers(mapped)
      setFilteredUsers(mapped)
      setIsEditDialogOpen(false)
      setSelectedUser(null)
    } catch (e) {
      // TODO: mostrar toast de error
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    try {
      await deleteUser(selectedUser.id)
      const refreshed = await listUsers()
      const mapped: UIUser[] = refreshed.map((u: any) => ({
        id: u.id || u.id_usuario,
        name: [u.nombre, u.apellido].filter(Boolean).join(" ") || u.nombre || u.apellido || "(Sin nombre)",
        email: u.email || "",
        role: (u.rol || u.role || "empleado").toLowerCase(),
        status: u.deleted_at ? "deleted" : (u.bloqueado ? "inactive" : "active"),
        assignedParkings: [],
        parkingNames: [],
        phone: u.telefono,
      }))
      setUsers(mapped)
      setFilteredUsers(mapped)
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    } catch (e) {
      // TODO: mostrar toast de error
    }
  }

  const openEditDialog = async (user: any) => {
    setSelectedUser(user)
    // Cargar asignaciones reales
    try {
      const assigned = await getUserParkings(user.id)
      const ids = Array.isArray(assigned) ? assigned.map((p: any) => String(p.id_parking || p.id)) : []
      const names = Array.isArray(assigned) ? assigned.map((p: any) => p.nombre || p.name) : []
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        assignedParkings: ids,
      })
      // Actualizar la UI del usuario seleccionado con nombres (solo visual)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, parkingNames: names } : u)))
      setFilteredUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, parkingNames: names } : u)))
    } catch (_) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        assignedParkings: user.assignedParkings,
      })
    }
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: any) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin_general":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin General</Badge>
      case "admin_parking":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Admin Parking</Badge>
      case "empleado":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Empleado</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactivo</Badge>
      case "deleted":
        return <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200">Eliminado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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
    <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs items={[{ label: "Usuarios" }]} />

          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-balance">Gestión de Usuarios</h1>
                <p className="text-muted-foreground mt-2">Administra los usuarios del sistema</p>
              </div>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>Completa la información del nuevo usuario.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: lettersOnly(e.target.value) })}
                        placeholder="Nombre del usuario"
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
                        placeholder="usuario@email.com"
                      />
                      {!validEmail && formData.email !== "" && (
                        <p className="text-xs text-red-600">Ingrese un email válido.</p>
                      )}
                    </div>
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
                    <div className="grid gap-2">
                      <Label htmlFor="role">Rol</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin_general">Admin General</SelectItem>
                          <SelectItem value="admin_parking">Admin Parking</SelectItem>
                          <SelectItem value="empleado">Empleado</SelectItem>
                          <SelectItem value="cliente">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Asignar Parkings</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {parkings.map((p) => (
                          <label key={p.id_parking} className="flex items-center space-x-2">
                            <Checkbox
                              checked={formData.assignedParkings.includes(String(p.id_parking))}
                              onCheckedChange={(checked) => handleParkingAssignment(String(p.id_parking), !!checked)}
                            />
                            <span>{p.nombre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} disabled={!canCreate}>Crear Usuario</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

                  {/* Controles de búsqueda y filtros */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          applyFilters()
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={roleFilter}
                      onValueChange={(value) => {
                        setRoleFilter(value)
                        applyFilters()
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrar por rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los roles</SelectItem>
                        <SelectItem value="admin_general">Admin General</SelectItem>
                        <SelectItem value="admin_parking">Admin Parking</SelectItem>
                        <SelectItem value="empleado">Empleado</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="active">Activos</SelectItem>
                        <SelectItem value="inactive">Inactivos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {users.filter((u) => u.status === "active").length} activos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admin General</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter((u) => u.role === "admin_general").length}</div>
                  <p className="text-xs text-muted-foreground">Acceso completo</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admin Parking</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter((u) => u.role === "admin_parking").length}</div>
                  <p className="text-xs text-muted-foreground">Acceso limitado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Empleados</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter((u) => u.role === "empleado").length}</div>
                  <p className="text-xs text-muted-foreground">Operaciones</p>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuarios {loading ? "" : `(${filteredUsers.length})`}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse h-10 rounded-md bg-muted/50" />
                    ))}
                  </div>
                ) : (
                  <div className={`overflow-x-auto ${loading ? "opacity-50" : "opacity-100 transition-opacity duration-200"}`}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.phone}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => openEditDialog(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {user.status !== "deleted" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={user.status === "inactive" ? "text-green-600 hover:text-green-700" : "text-yellow-600 hover:text-yellow-700"}
                                    onClick={async () => {
                                      try {
                                        await toggleBlockUser(user.id)
                                        const refreshed = await listUsers()
                                        const mapped: UIUser[] = refreshed.map((u: any) => ({
                                          id: u.id || u.id_usuario,
                                          name: [u.nombre, u.apellido].filter(Boolean).join(" ") || u.nombre || u.apellido || "(Sin nombre)",
                                          email: u.email || "",
                                          role: (u.rol || u.role || "empleado").toLowerCase(),
                                          status: u.deleted_at ? "deleted" : (u.bloqueado ? "inactive" : "active"),
                                          assignedParkings: [],
                                          parkingNames: [],
                                          phone: u.telefono,
                                        }))
                                        setUsers(mapped)
                                        setFilteredUsers(mapped)
                                      } catch (e) {}
                                    }}
                                  >
                                    {user.status === "inactive" ? "Desbloquear" : "Bloquear"}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => openDeleteDialog(user)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica la información del usuario.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_general">Admin General</SelectItem>
                  <SelectItem value="admin_parking">Admin Parking</SelectItem>
                  <SelectItem value="empleado">Empleado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.role === "admin_parking" || formData.role === "empleado") && (
              <div className="grid gap-2">
                <Label>Parkings Asignados</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {parkings.map((parking: ParkingRecord) => (
                    <div key={parking.id_parking} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-parking-${parking.id_parking}`}
                        checked={formData.assignedParkings.includes(String(parking.id_parking))}
                        onCheckedChange={(checked) => handleParkingAssignment(String(parking.id_parking), checked as boolean)}
                      />
                      <Label htmlFor={`edit-parking-${parking.id_parking}`} className="text-sm">
                        {parking.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar a "{selectedUser?.name}"? Esta acción no se puede deshacer.
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
    </div>
  )
}

export default function UsersPage() {
  return (
    <AuthGuard allowedRoles={["admin_general"]}>
      <UsersPageContent />
    </AuthGuard>
  )
}
