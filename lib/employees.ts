import api from "./api"

export type EmployeeRecord = {
  id_usuario: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol: "empleado"
  bloqueado?: boolean
  deleted_at?: string | null
}

export async function listScopedEmployees(): Promise<EmployeeRecord[]> {
  const res = await api.get(`/usuarios/empleados/scoped`)
  const data = res.data?.data ?? res.data
  if (Array.isArray(data)) return data
  return []
}

export async function updateEmployee(id: string, payload: Partial<EmployeeRecord>) {
  const res = await api.put(`/usuarios/${id}`, payload)
  return res.data?.data ?? res.data
}

export async function createEmployee(payload: { nombre: string; apellido: string; email: string; telefono?: string; parking_ids?: number[] }) {
  const res = await api.post(`/usuarios/empleados`, payload)
  return res.data?.data ?? res.data
}

export async function deleteEmployee(id: string) {
  const res = await api.delete(`/usuarios/empleados/${id}`)
  return res.data?.data ?? res.data
}
