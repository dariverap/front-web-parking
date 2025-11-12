import api from "./api";

// ========== TIPOS ==========
export interface ReservaRecord {
  id_reserva: string;
  id_usuario: string;
  id_espacio: string;
  id_vehiculo: string;
  hora_inicio: string;
  hora_fin: string;
  fecha_reserva: string;
  estado: 'activa' | 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  // Campos para reservas manuales (invitado - persona)
  guest_nombre?: string | null;
  guest_documento?: string | null;
  guest_telefono?: string | null;
  // Campos para reservas manuales (invitado - vehículo)
  guest_vehiculo_placa?: string | null;
  guest_vehiculo_marca?: string | null;
  guest_vehiculo_modelo?: string | null;
  guest_vehiculo_color?: string | null;
  tipo_origen?: string | null;
  usuario?: {
    id_usuario: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
  espacio?: {
    id_espacio: string;
    numero_espacio: string;
    estado: string;
    id_parking: string;
  };
  vehiculo?: {
    id_vehiculo: string;
    placa: string;
    marca?: string;
    modelo?: string;
    color?: string;
  };
}

export interface OcupacionRecord {
  id_ocupacion: string;
  id_reserva?: string;
  id_usuario?: string | null;
  id_espacio: string;
  id_vehiculo?: string;
  hora_entrada: string;
  hora_salida?: string;
  hora_salida_solicitada?: string | null;
  tiempo_total?: number;
  monto_calculado?: number;
  costo_total?: number;
  nombre_usuario?: string;
  numero_espacio?: string;
  // Campos de invitado (persona)
  guest_nombre?: string;
  guest_documento?: string;
  guest_telefono?: string;
  // Campos de vehículo (registrado o invitado)
  placa?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  // Campos de vehículo invitado explícitos
  guest_vehiculo_placa?: string;
  guest_vehiculo_marca?: string;
  guest_vehiculo_modelo?: string;
  guest_vehiculo_color?: string;
}

// ========== FUNCIONES DE RESERVAS ==========

/**
 * Obtener reservas activas de un parking
 * @param parkingId - ID del parking
 * @param estado - Estado de las reservas (opcional: 'activa', 'pendiente', etc.)
 */
export async function listReservasByParking(
  parkingId: string,
  estado?: string
): Promise<ReservaRecord[]> {
  try {
    const params: any = { id_parking: parkingId };
    if (estado) params.estado = estado;

    const response = await api.get("/reservas", { params });
    
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error al obtener reservas:", error);
    throw new Error(error.response?.data?.message || "Error al obtener reservas");
  }
}

/**
 * Obtener una reserva por ID
 */
export async function getReservaById(id: string): Promise<ReservaRecord> {
  try {
    const response = await api.get(`/reservas/${id}`);
    
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    throw new Error("Reserva no encontrada");
  } catch (error: any) {
    console.error("Error al obtener reserva:", error);
    throw new Error(error.response?.data?.message || "Error al obtener reserva");
  }
}

/**
 * Actualizar estado de una reserva
 */
export async function updateEstadoReserva(
  id: string,
  estado: string
): Promise<ReservaRecord> {
  try {
    const response = await api.patch(`/reservas/${id}/estado`, { estado });
    
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    throw new Error("Error al actualizar estado");
  } catch (error: any) {
    console.error("Error al actualizar estado de reserva:", error);
    throw new Error(error.response?.data?.message || "Error al actualizar estado");
  }
}

/**
 * Cancelar una reserva
 */
export async function cancelarReserva(id: string): Promise<void> {
  try {
    await updateEstadoReserva(id, "cancelada");
  } catch (error: any) {
    console.error("Error al cancelar reserva:", error);
    throw new Error(error.response?.data?.message || "Error al cancelar reserva");
  }
}

/**
 * Crear una nueva reserva
 */
export async function createReserva(data: {
  id_espacio: string;
  id_vehiculo: string;
  fecha_inicio: string;
  fecha_fin: string;
}): Promise<ReservaRecord> {
  try {
    const response = await api.post("/reservas", data);
    
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    throw new Error("Error al crear reserva");
  } catch (error: any) {
    console.error("Error al crear reserva:", error);
    throw new Error(error.response?.data?.message || "Error al crear reserva");
  }
}

// ========== FUNCIONES DE OCUPACIONES ==========

/**
 * Obtener ocupaciones activas de un parking
 * @param parkingId - ID del parking
 */
export async function listOcupacionesActivas(
  parkingId: string
): Promise<OcupacionRecord[]> {
  try {
    const response = await api.get("/ocupaciones/activas", {
      params: { id_parking: parkingId }
    });
    
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error al obtener ocupaciones activas:", error);
    throw new Error(error.response?.data?.message || "Error al obtener ocupaciones");
  }
}

/**
 * Confirmar entrada desde una reserva (crear ocupación)
 */
export async function confirmarEntrada(idReserva: string): Promise<OcupacionRecord> {
  try {
    const response = await api.post("/ocupaciones/marcar-entrada", {
      id_reserva: idReserva
    });
    
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    throw new Error("Error al confirmar entrada");
  } catch (error: any) {
    console.error("Error al confirmar entrada:", error);
    throw new Error(error.response?.data?.message || "Error al confirmar entrada");
  }
}

/**
 * Registrar salida de una ocupación
 */
export async function registrarSalida(
  idOcupacion: string,
  metodoPago?: string
): Promise<OcupacionRecord> {
  try {
    const response = await api.post(`/ocupaciones/${idOcupacion}/salida`, {
      metodo_pago: metodoPago
    });
    
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    throw new Error("Error al registrar salida");
  } catch (error: any) {
    console.error("Error al registrar salida:", error);
    throw new Error(error.response?.data?.message || "Error al registrar salida");
  }
}

/**
 * Calcular monto de una ocupación activa
 */
export async function calcularMonto(idOcupacion: string): Promise<{
  monto: number;
  tiempo_minutos: number;
  hora_entrada: string;
  parking: {
    nombre: string;
    tarifa_hora?: number;
    tarifa_base?: number;
  };
}> {
  try {
    const response = await api.get(`/ocupaciones/${idOcupacion}/calcular-monto`);
    
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    throw new Error("Error al calcular monto");
  } catch (error: any) {
    console.error("Error al calcular monto:", error);
    throw new Error(error.response?.data?.message || "Error al calcular monto");
  }
}

/**
 * Obtener todas las ocupaciones (con filtros opcionales)
 */
export async function listAllOcupaciones(): Promise<OcupacionRecord[]> {
  try {
    const response = await api.get("/ocupaciones");
    
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error al obtener ocupaciones:", error);
    throw new Error(error.response?.data?.message || "Error al obtener ocupaciones");
  }
}

/**
 * Obtener historial de ocupaciones finalizadas de un parking
 * @param parkingId - ID del parking
 */
export async function listHistorialOcupaciones(
  parkingId: string
): Promise<OcupacionRecord[]> {
  try {
    const response = await api.get("/ocupaciones/historial", {
      params: { id_parking: parkingId }
    });
    
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error al obtener historial de ocupaciones:", error);
    throw new Error(error.response?.data?.message || "Error al obtener historial");
  }
}

/**
 * Verificar disponibilidad de un espacio
 */
export async function verificarDisponibilidad(data: {
  id_espacio: string;
  fecha_inicio: string;
  fecha_fin: string;
}): Promise<boolean> {
  try {
    const response = await api.post("/reservas/verificar-disponibilidad", data);
    
    if (response.data?.success) {
      return response.data.disponible;
    }
    return false;
  } catch (error: any) {
    console.error("Error al verificar disponibilidad:", error);
    throw new Error(error.response?.data?.message || "Error al verificar disponibilidad");
  }
}
