import api from "./api";

export interface PagoPendiente {
  id_pago: number;
  id_ocupacion: number;
  id_usuario: string;
  monto: number;
  estado: string;
  created_at: string;
  // Datos relacionados desde ocupacion
  nombre_usuario?: string;
  vehiculo_placa?: string;
  numero_espacio?: string;
  hora_entrada?: string;
  hora_salida_solicitada?: string;
  tiempo_total_minutos?: number;
}

export interface PagoRecord {
  id_pago: number;
  id_ocupacion: number;
  id_usuario: string;
  id_metodo_pago?: number;
  monto: number;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
  comprobante?: string;
  fecha_pago?: string;
  emitido_en?: string;
  vuelto?: number;
}

/**
 * Listar pagos pendientes de un parking
 */
export async function listPagosPendientesByParking(
  parkingId: string
): Promise<PagoPendiente[]> {
  try {
    const response = await api.get(`/pagos/pendientes`, {
      params: { id_parking: parkingId },
    });
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error al obtener pagos pendientes:", error);
    throw new Error(
      error.response?.data?.message || "Error al obtener pagos pendientes"
    );
  }
}

/**
 * Validar un pago (admin/empleado confirma que se pagó)
 */
export async function validarPago(
  idPago: number,
  metodoPagoId?: number
): Promise<void> {
  try {
    const response = await api.patch(`/pagos/${idPago}/validar`, {
      id_metodo_pago: metodoPagoId,
    });
    if (!response.data?.success) {
      throw new Error("Error al validar pago");
    }
  } catch (error: any) {
    console.error("Error al validar pago:", error);
    throw new Error(
      error.response?.data?.message || "Error al validar pago"
    );
  }
}

/**
 * Obtener todos los pagos (con filtros opcionales)
 */
export async function listAllPagos(params?: {
  id_parking?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}): Promise<PagoRecord[]> {
  try {
    const response = await api.get('/pagos', { params });
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error al obtener pagos:", error);
    throw new Error(
      error.response?.data?.message || "Error al obtener pagos"
    );
  }
}

