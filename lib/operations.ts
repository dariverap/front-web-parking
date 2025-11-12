import api from "./api";

export type OperationTimelineItem = {
  key: string;
  label: string;
  at?: string | null;
};

export type OperationRecord = {
  id_operacion: string;
  id_reserva?: string;
  id_ocupacion?: string;
  tipo?: "reserva" | "walk_in";
  estado_final:
    | "pendiente"
    | "confirmada"
    | "activa"
    | "finalizada"
    | "finalizada_pagada"
    | "cancelada"
    | "expirada"
    | "no_show"
    | string;
  usuario?: {
    id_usuario?: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
  } | null;
  // Campos de invitado (persona)
  guest_nombre?: string | null;
  guest_documento?: string | null;
  guest_telefono?: string | null;
  vehiculo?: {
    id_vehiculo?: string;
    placa?: string;
    marca?: string;
    modelo?: string;
    color?: string;
  } | null;
  // Campos de vehículo invitado
  guest_vehiculo_placa?: string | null;
  guest_vehiculo_marca?: string | null;
  guest_vehiculo_modelo?: string | null;
  guest_vehiculo_color?: string | null;
  espacio?: {
    id_espacio?: string;
    numero_espacio?: string;
    id_parking?: string;
  } | null;
  fechas: {
    creada_at?: string | null;
    hora_programada_inicio?: string | null;
    hora_programada_fin?: string | null;
    entrada_at?: string | null;
    salida_at?: string | null;
    cancelada_at?: string | null;
    expirada_at?: string | null;
    pago_at?: string | null;
  };
  pago?: {
    id_pago?: number;
    monto?: number | null;
    estado?: string;
    metodo?: string | null;
    metodo_tipo?: string | null; // 'efectivo', 'yape', 'plin', 'tarjeta'
    comprobante?: {
      tipo?: string | null;
      serie?: string | null;
      numero?: number | null;
      emitido_en?: string | null;
    } | null;
  } | null;
  duracion_minutos?: number | null;
  timeline?: OperationTimelineItem[];
};

function toNombreCompleto(r?: { nombre?: string; apellido?: string } | null | undefined) {
  if (!r) return undefined;
  const n = [r.nombre, r.apellido].filter(Boolean).join(" ");
  return n || undefined;
}

/**
 * Obtener operaciones de un parking desde el endpoint unificado del backend
 * @param parkingId - ID del parking
 * @param filters - Filtros opcionales { estado, fecha_desde, fecha_hasta, q }
 */
export async function listOperationsForParking(
  parkingId: string,
  filters?: { estado?: string; fecha_desde?: string; fecha_hasta?: string; q?: string }
): Promise<OperationRecord[]> {
  try {
    const params: any = {};
    if (filters?.estado) params.estado = filters.estado;
    if (filters?.fecha_desde) params.fecha_desde = filters.fecha_desde;
    if (filters?.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
    if (filters?.q) params.q = filters.q;

    const response = await api.get(`/historial/operaciones/${parkingId}`, { params });

    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error al obtener operaciones:", error);
    throw new Error(error.response?.data?.message || "Error al obtener operaciones");
  }
}

// Función auxiliar para construir timeline en el cliente si es necesario (ahora opcional, el backend puede enviarla)
export function buildTimeline(op: OperationRecord): OperationTimelineItem[] {
  const t: OperationTimelineItem[] = [];
  if (op.fechas.creada_at) t.push({ key: "creada", label: "Reserva creada", at: op.fechas.creada_at });
  if (op.estado_final === "confirmada") {
    if (op.fechas.hora_programada_inicio) t.push({ key: "confirmada", label: "Reserva confirmada", at: op.fechas.hora_programada_inicio });
  } else if (op.estado_final === "pendiente") {
    if (op.fechas.hora_programada_inicio) t.push({ key: "pendiente", label: "Reserva pendiente", at: op.fechas.hora_programada_inicio });
  }
  if (op.fechas.entrada_at) t.push({ key: "entrada", label: "Entrada al parking", at: op.fechas.entrada_at });
  if (op.fechas.salida_at) t.push({ key: "salida", label: "Salida del parking", at: op.fechas.salida_at });
  if (op.pago?.comprobante?.emitido_en) t.push({ key: "pago", label: "Pago emitido", at: op.pago.comprobante.emitido_en });
  if (op.estado_final === "cancelada" && op.fechas.cancelada_at) t.push({ key: "cancelada", label: "Reserva cancelada", at: op.fechas.cancelada_at });
  if (op.estado_final === "expirada" && op.fechas.expirada_at) t.push({ key: "expirada", label: "Reserva expirada", at: op.fechas.expirada_at });
  return t;
}

// DEPRECADO: Composición en el cliente, ya no se usa con el endpoint unificado
export async function _listOperationsForParkingOLD(parkingId: string): Promise<OperationRecord[]> {
  // Cargar reservas (todas), historial de ocupaciones y pagos del parking
  const [reservas, ocupHist, pagos] = await Promise.all<[
    ReservaRecord[],
    OcupacionRecord[],
    PagoRecord[]
  ]>([
    listReservasByParking(parkingId),
    listHistorialOcupaciones(parkingId),
    listAllPagos({ id_parking: parkingId }),
  ]);

  // Indexaciones útiles
  const pagosByOcupacion = new Map<number | string, PagoRecord[]>();
  for (const p of pagos) {
    const key = String((p as any).id_ocupacion ?? (p as any).ocupacion_id ?? "");
    if (!key) continue;
    const arr = pagosByOcupacion.get(key) || [];
    arr.push(p);
    pagosByOcupacion.set(key, arr);
  }

  const ocupByReserva = new Map<string, OcupacionRecord[]>();
  const ocupWalkIn: OcupacionRecord[] = [];
  for (const o of ocupHist) {
    if (o.id_reserva) {
      const arr = ocupByReserva.get(o.id_reserva) || [];
      arr.push(o);
      ocupByReserva.set(o.id_reserva, arr);
    } else {
      ocupWalkIn.push(o);
    }
  }

  const ops: OperationRecord[] = [];

  // 1) Operaciones provenientes de reservas (incluye canceladas/expiradas/completadas)
  for (const r of reservas) {
    const ocs = (r.id_reserva && ocupByReserva.get(r.id_reserva)) || [];
    const oc = ocs.sort((a, b) => new Date(b.hora_entrada).getTime() - new Date(a.hora_entrada).getTime())[0];
    const pagosOc = oc ? pagosByOcupacion.get(String(oc.id_ocupacion)) || [] : [];
    const pagoCompleto = pagosOc.find((p) => String(p.estado).toUpperCase() === "COMPLETADO");

    let estado_final: OperationRecord["estado_final"] = r.estado;
    if (oc && oc.hora_salida) {
      estado_final = pagoCompleto ? "finalizada_pagada" : "finalizada";
    }

    const opBase: OperationRecord = {
      id_operacion: `res-${r.id_reserva}`,
      id_reserva: r.id_reserva,
      id_ocupacion: oc?.id_ocupacion,
      estado_final,
      usuario: r.usuario ? { ...r.usuario } : undefined,
      vehiculo: r.vehiculo ? { ...r.vehiculo } : undefined,
      espacio: r.espacio ? { ...r.espacio } : undefined,
      fechas: {
        creada_at: (r as any).creada_at || null,
        hora_programada_inicio: r.hora_inicio || null,
        hora_programada_fin: r.hora_fin || null,
        entrada_at: oc?.hora_entrada || null,
        salida_at: oc?.hora_salida || null,
        cancelada_at: estado_final === "cancelada" ? ((r as any).cancelada_at || null) : null,
        expirada_at: estado_final === "expirada" ? ((r as any).expirada_at || null) : null,
        pago_at: pagoCompleto?.fecha_pago || pagoCompleto?.emitido_en || null,
      },
      pago: pagoCompleto
        ? {
            monto: (pagoCompleto as any).monto ?? null,
            estado: pagoCompleto.estado,
            metodo: (pagoCompleto as any).metodo || null,
            comprobante: {
              tipo: (pagoCompleto as any).tipo_comprobante || null,
              serie: (pagoCompleto as any).serie || null,
              numero: (pagoCompleto as any).numero || null,
              emitido_en: (pagoCompleto as any).emitido_en || pagoCompleto.fecha_pago || null,
            },
          }
        : null,
      duracion_minutos: (oc as any)?.tiempo_total || (oc as any)?.tiempo_total_minutos || null,
      timeline: [],
    };

    opBase.timeline = buildTimeline(opBase);
    ops.push(opBase);
  }

  // 2) Walk-in: ocupaciones sin reserva
  for (const oc of ocupWalkIn) {
    const pagosOc = pagosByOcupacion.get(String(oc.id_ocupacion)) || [];
    const pagoCompleto = pagosOc.find((p) => String(p.estado).toUpperCase() === "COMPLETADO");

    const estado_final: OperationRecord["estado_final"] = oc.hora_salida
      ? pagoCompleto ? "finalizada_pagada" : "finalizada"
      : "activa";

    // Preferir datos anidados si existen, con fallback a campos planos
    const usuarioFromOc: any = (oc as any).usuario || null;
    const vehiculoFromOc: any = (oc as any).vehiculo || null;

    const opBase: OperationRecord = {
      id_operacion: `oc-${oc.id_ocupacion}`,
      id_ocupacion: oc.id_ocupacion,
      estado_final,
      usuario: usuarioFromOc
        ? { id_usuario: usuarioFromOc.id_usuario, nombre: usuarioFromOc.nombre, apellido: usuarioFromOc.apellido, email: usuarioFromOc.email, telefono: usuarioFromOc.telefono }
        : (oc as any).nombre_usuario
          ? { nombre: (oc as any).nombre_usuario }
          : undefined,
      vehiculo: vehiculoFromOc
        ? { id_vehiculo: vehiculoFromOc.id_vehiculo, placa: vehiculoFromOc.placa, marca: vehiculoFromOc.marca, modelo: vehiculoFromOc.modelo, color: vehiculoFromOc.color }
        : (oc as any).placa
          ? { placa: (oc as any).placa, marca: (oc as any).marca, modelo: (oc as any).modelo, color: (oc as any).color }
          : undefined,
      espacio: oc.numero_espacio ? { numero_espacio: oc.numero_espacio, id_espacio: oc.id_espacio } : undefined,
      fechas: {
        creada_at: null,
        hora_programada_inicio: null,
        hora_programada_fin: null,
        entrada_at: oc.hora_entrada || null,
        salida_at: oc.hora_salida || null,
        cancelada_at: null,
        expirada_at: null,
        pago_at: pagoCompleto?.fecha_pago || (pagoCompleto as any)?.emitido_en || null,
      },
      pago: pagoCompleto
        ? {
            monto: (pagoCompleto as any).monto ?? null,
            estado: pagoCompleto.estado,
            metodo: (pagoCompleto as any).metodo || null,
            comprobante: {
              tipo: (pagoCompleto as any).tipo_comprobante || null,
              serie: (pagoCompleto as any).serie || null,
              numero: (pagoCompleto as any).numero || null,
              emitido_en: (pagoCompleto as any).emitido_en || pagoCompleto.fecha_pago || null,
            },
          }
        : null,
      duracion_minutos: (oc as any)?.tiempo_total || (oc as any)?.tiempo_total_minutos || null,
      timeline: [],
    };
    opBase.timeline = buildTimeline(opBase);
    ops.push(opBase);
  }

  // Ordenar por fecha más reciente (pago/ salida/ entrada/ programada)
  const keyDate = (op: OperationRecord) =>
    op.fechas.pago_at || op.fechas.salida_at || op.fechas.entrada_at || op.fechas.hora_programada_inicio || op.fechas.creada_at || "";

  ops.sort((a, b) => new Date(keyDate(b)!).getTime() - new Date(keyDate(a)!).getTime());

  return ops;
}
