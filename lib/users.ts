import api from "./api";

export type UserRecord = {
  id?: string; // backend may use id or id_usuario
  id_usuario?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: "admin_general" | "admin_parking" | "empleado" | "cliente";
  bloqueado?: boolean;
  deleted_at?: string | null;
};

export async function listUsers(): Promise<UserRecord[]> {
  const res = await api.get(`/usuarios`);
  const data = res.data?.data ?? res.data; // tolerate wrapper
  return Array.isArray(data) ? data : [];
}

export async function getUser(id: string): Promise<UserRecord> {
  const res = await api.get(`/usuarios/${id}`);
  return res.data?.data ?? res.data;
}

export async function updateUser(id: string, payload: Partial<UserRecord>) {
  const res = await api.put(`/usuarios/${id}`, payload);
  return res.data?.data ?? res.data;
}

export async function toggleBlockUser(id: string) {
  const res = await api.patch(`/usuarios/${id}/bloqueo`);
  return res.data?.data ?? res.data;
}

export async function deleteUser(id: string) {
  const res = await api.delete(`/usuarios/${id}`);
  return res.data?.data ?? res.data;
}

// Parking assignments
export async function getUserParkings(id: string) {
  const res = await api.get(`/usuarios/${id}/parkings`);
  return res.data?.data ?? res.data;
}

export type ParkingAssignment = { id_parking: number; rol_en_parking: 'admin_parking' | 'empleado' };

export async function assignParkingsToUser(id: string, assignments: ParkingAssignment[]) {
  const res = await api.post(`/usuarios/${id}/parkings`, { assignments });
  return res.data?.data ?? res.data;
}

export async function removeParkingFromUser(id: string, id_parking: number) {
  const res = await api.delete(`/usuarios/${id}/parkings/${id_parking}`);
  return res.data?.data ?? res.data;
}
