import api from "./api"

export type TarifaRecord = {
  id_tarifa: number
  id_parking: number
  tipo: string
  monto: number
  condiciones?: string | null
}

export async function listTarifasByParking(parkingId: number | string): Promise<TarifaRecord[]> {
  const res = await api.get(`/parking/${parkingId}/tarifas`)
  const data = res.data?.data ?? res.data
  return Array.isArray(data) ? data : []
}

export async function createTarifa(parkingId: number | string, payload: { tipo: string; monto: number; condiciones?: string }) {
  // Usar ruta normal con middleware simplificado para debugging
  const res = await api.post(`/parking/${parkingId}/tarifas`, payload)
  return res.data?.data ?? res.data
}

export async function updateTarifa(parkingId: number | string, tarifaId: number | string, payload: Partial<{ tipo: string; monto: number; condiciones?: string }>) {
  const res = await api.put(`/parking/${parkingId}/tarifas/${tarifaId}`, payload)
  return res.data?.data ?? res.data
}

export async function deleteTarifa(parkingId: number | string, tarifaId: number | string) {
  const res = await api.delete(`/parking/${parkingId}/tarifas/${tarifaId}`)
  return res.data?.data ?? res.data
}
