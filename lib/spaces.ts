import api from "./api"

export type SpaceRecord = {
  id_espacio: number
  id_parking: number
  numero_espacio: string
  estado: string // 'disponible' | 'ocupado' | 'inhabilitado' | ...
}

export async function listSpacesByParking(parkingId: number | string): Promise<SpaceRecord[]> {
  const res = await api.get(`/parking/${parkingId}/spaces`, {
    params: { ts: Date.now() },
    timeout: 4000,
    headers: { 'Cache-Control': 'no-cache' },
  })
  const data = res.data?.data ?? res.data
  return Array.isArray(data) ? data : []
}

export async function toggleSpaceEnabled(parkingId: number | string, spaceId: number | string) {
  // Send an explicit empty JSON body to ensure Content-Length is set; shorter timeout to align with server guards
  const res = await api.patch(`/parking/${parkingId}/spaces/${spaceId}/toggle-enabled`, {}, { timeout: 4000 })
  return res.data?.data ?? res.data
}
