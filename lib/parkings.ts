import api from "./api";

export type ParkingRecord = {
  id_parking: number
  nombre: string
  direccion?: string
  latitud?: number
  longitud?: number
  capacidad_total?: number
  ocupados?: number
  estado?: "activo" | "inactivo" | "mantenimiento" | string
  id_admin?: string
  admin_nombre?: string
  revenue?: number
}

export async function listAllParkings(): Promise<ParkingRecord[]> {
  const res = await api.get(`/parking`)
  const data = res.data?.data ?? res.data
  return Array.isArray(data) ? data : []
}

// List parkings assigned to a specific user (uses backend route GET /parking/user/:userId)
export async function listParkingsByUser(userId: string): Promise<ParkingRecord[]> {
  const res = await api.get(`/parking/user/${userId}`)
  const data = res.data?.data ?? res.data
  return Array.isArray(data) ? data : []
}

// List parkings where the given admin is the assigned admin (GET /parking/admin/:adminId)
export async function listParkingsByAdmin(adminId: string): Promise<ParkingRecord[]> {
  const res = await api.get(`/parking/admin/${adminId}`)
  const data = res.data?.data ?? res.data
  return Array.isArray(data) ? data : []
}

export async function getParkingById(id: number | string): Promise<ParkingRecord> {
  const res = await api.get(`/parking/${id}`)
  return res.data?.data ?? res.data
}

export async function createParking(payload: Partial<ParkingRecord> & { capacidad_total: number; direccion: string; latitud: number; longitud: number; id_admin_asignado?: string }) {
  const res = await api.post(`/parking`, payload)
  return res.data?.data ?? res.data
}

export async function updateParking(id: number | string, payload: Partial<ParkingRecord>) {
  const res = await api.put(`/parking/${id}`, payload)
  return res.data?.data ?? res.data
}

export async function assignAdminToParking(id: number | string, id_admin: string) {
  const res = await api.put(`/parking/${id}/assign-admin`, { id_admin })
  return res.data?.data ?? res.data
}

export async function softDeleteParking(id: number | string, motivo?: string) {
  const res = await api.delete(`/parking/${id}`, { data: { motivo } })
  return res.data?.data ?? res.data
}

export async function listDeletedParkings(): Promise<ParkingRecord[]> {
  const res = await api.get(`/parking/admin-deleted/list`)
  const data = res.data?.data ?? res.data
  return Array.isArray(data) ? data : []
}

export async function restoreParking(id: number | string) {
  const res = await api.patch(`/parking/${id}/restore`)
  return res.data?.data ?? res.data
}
