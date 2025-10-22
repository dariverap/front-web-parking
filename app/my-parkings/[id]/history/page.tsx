"use client"

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCcw, ClipboardList, Clock, Eye, Banknote, Smartphone, CreditCard } from "lucide-react";
import { listOperationsForParking, buildTimeline, type OperationRecord } from "@/lib/operations";

export default function ParkingHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const parkingId = params?.id as string | undefined;

  const [ops, setOps] = useState<OperationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Filtros
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState(""); // yyyy-mm-dd
  const [hasta, setHasta] = useState(""); // yyyy-mm-dd
  const [estado, setEstado] = useState<string>("");

  // Detalle
  const [detalle, setDetalle] = useState<OperationRecord | null>(null);

  const reload = async () => {
    if (!parkingId) return;
    setLoading(true);
    setError("");
    try {
      // Ahora usa filtros server-side
      const filters: any = {};
      if (estado) filters.estado = estado;
      if (desde) filters.fecha_desde = desde;
      if (hasta) filters.fecha_hasta = hasta;
      if (q) filters.q = q;

      const data = await listOperationsForParking(parkingId, filters);
      setOps(data);
    } catch (e: any) {
      setError(e?.message || "Error al cargar historial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parkingId) {
      void reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkingId, estado, desde, hasta, q]);

  // Estados disponibles desde el dataset actual (ya filtrado por el servidor)
  const estadosDisponibles = useMemo(() => {
    const set = new Set<string>();
    ops.forEach(o => set.add(o.estado_final));
    return Array.from(set);
  }, [ops]);

  // Ya no filtramos en el cliente; el backend aplica filtros server-side

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Mis Parkings", href: "/my-parkings" },
    { label: `Parking #${parkingId || ""}`, href: `/my-parkings/${parkingId}` },
    { label: "Historial", href: "#" },
  ];

  const colorByEstado = (s: string) => {
    const up = s.toLowerCase();
    if (up === "finalizada_pagada") return "bg-emerald-500/10 text-emerald-700 border-emerald-300";
    if (up === "finalizada") return "bg-violet-500/10 text-violet-700 border-violet-300";
    if (up === "activa") return "bg-blue-500/10 text-blue-700 border-blue-300";
    if (up === "pendiente") return "bg-amber-500/10 text-amber-700 border-amber-300";
    if (up === "confirmada") return "bg-cyan-500/10 text-cyan-700 border-cyan-300";
    if (up === "cancelada") return "bg-rose-500/10 text-rose-700 border-rose-300";
    if (up === "expirada") return "bg-slate-500/10 text-slate-700 border-slate-300";
    if (up === "no_show") return "bg-neutral-500/10 text-neutral-700 border-neutral-300";
    return "bg-secondary";
  };

  const labelByEstado = (s: string) => {
    const up = s.toLowerCase();
    if (up === "finalizada_pagada") return "Pagada";
    if (up === "finalizada") return "Finalizada";
    if (up === "activa") return "En curso";
    if (up === "pendiente") return "Pendiente";
    if (up === "confirmada") return "Confirmada";
    if (up === "cancelada") return "Cancelada";
    if (up === "expirada") return "Expirada";
    if (up === "no_show") return "No asistió";
    return s;
  };

  const iconByMetodo = (metodo_tipo?: string | null) => {
    const tipo = (metodo_tipo || "").toLowerCase();
    if (tipo.includes("efectivo")) return <Banknote className="h-4 w-4" />;
    if (tipo.includes("yape") || tipo.includes("plin")) return <Smartphone className="h-4 w-4" />;
    if (tipo.includes("tarjeta")) return <CreditCard className="h-4 w-4" />;
    return <Banknote className="h-4 w-4" />;
  };

  return (
    <AuthGuard allowedRoles={["admin_general", "admin_parking", "empleado"]}>
      <div className="p-6 pt-16 md:pt-6">
        <Breadcrumbs items={breadcrumbs} />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Historial de operaciones</h1>
              <p className="text-muted-foreground mt-2">Reservas, entradas/salidas y pagos en un solo lugar.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push(`/my-parkings/${parkingId}`)}>Volver al panel</Button>
              <Button variant="ghost" size="icon" onClick={() => void reload()} disabled={loading} title="Refrescar">
                <RefreshCcw className={"h-4 w-4" + (loading ? " animate-spin" : "")} />
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Historial</CardTitle>
              <div className="flex items-center gap-2">
                <Input className="w-48" placeholder="Buscar (usuario, placa, espacio)" value={q} onChange={e => setQ(e.target.value)} />
                <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
                <span className="text-sm text-muted-foreground">a</span>
                <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
                <select className="h-9 rounded-md border px-2 text-sm bg-background" value={estado} onChange={e => setEstado(e.target.value)}>
                  <option value="">Todos los estados</option>
                  {estadosDisponibles.map(es => (
                    <option key={es} value={es}>{es}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Espacio</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead className="text-right">Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ops.map(op => {
                      const baseDate = op.fechas.pago_at || op.fechas.salida_at || op.fechas.entrada_at || op.fechas.hora_programada_inicio || op.fechas.creada_at || "";
                      const fechaStr = baseDate ? new Date(baseDate).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';
                      const nombre = op.usuario ? [op.usuario.nombre, op.usuario.apellido].filter(Boolean).join(' ') : '—';
                      const placa = op.vehiculo?.placa || '—';
                      const marcaModelo = [op.vehiculo?.marca, op.vehiculo?.modelo].filter(Boolean).join(' ');
                      const espacio = op.espacio?.numero_espacio || '—';
                      const mins = op.duracion_minutos || 0;
                      const horas = Math.floor(mins/60); const mm = mins % 60; const durStr = mins>0 ? `${horas}h ${mm}m` : '—';
                      const monto = op.pago?.monto ?? null;

                      return (
                        <TableRow key={op.id_operacion}>
                          <TableCell className="text-sm">{fechaStr}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className={colorByEstado(op.estado_final)}>{labelByEstado(op.estado_final)}</Badge>
                              {op.pago && (
                                <span title={op.pago.metodo || "Método de pago"}>
                                  {iconByMetodo(op.pago.metodo_tipo)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{nombre}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{placa}</span>
                              {marcaModelo && <span className="text-xs text-muted-foreground">{marcaModelo}</span>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{espacio}</Badge></TableCell>
                          <TableCell className="text-sm">{durStr}</TableCell>
                          <TableCell className="text-sm font-semibold">{monto != null ? `S/. ${Number(monto).toFixed(2)}` : '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => setDetalle(op)} title="Ver detalles">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {ops.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Sin resultados</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detalle */}
          <Dialog open={!!detalle} onOpenChange={() => setDetalle(null)}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Detalle de operación</DialogTitle>
                <DialogDescription>Resumen del ciclo completo y comprobante si aplica.</DialogDescription>
              </DialogHeader>
              {detalle && (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div><span className="text-muted-foreground">Estado:</span> <Badge variant="secondary" className={colorByEstado(detalle.estado_final)}>{detalle.estado_final}</Badge></div>
                    <div><span className="text-muted-foreground">Usuario:</span> {[detalle.usuario?.nombre, detalle.usuario?.apellido].filter(Boolean).join(' ') || '—'}</div>
                    <div><span className="text-muted-foreground">Email:</span> {detalle.usuario?.email || '—'}</div>
                    <div><span className="text-muted-foreground">Teléfono:</span> {detalle.usuario?.telefono || '—'}</div>
                    <div><span className="text-muted-foreground">Vehículo:</span> {detalle.vehiculo?.placa || '—'} {detalle.vehiculo?.marca || detalle.vehiculo?.modelo ? `· ${detalle.vehiculo?.marca||''} ${detalle.vehiculo?.modelo||''}` : ''}</div>
                    <div><span className="text-muted-foreground">Espacio:</span> {detalle.espacio?.numero_espacio || '—'}</div>
                    <div><span className="text-muted-foreground">Programado:</span> {detalle.fechas.hora_programada_inicio ? new Date(detalle.fechas.hora_programada_inicio).toLocaleString('es-PE') : '—'}{detalle.fechas.hora_programada_fin ? ` → ${new Date(detalle.fechas.hora_programada_fin).toLocaleString('es-PE')}` : ''}</div>
                    <div><span className="text-muted-foreground">Entrada:</span> {detalle.fechas.entrada_at ? new Date(detalle.fechas.entrada_at).toLocaleString('es-PE') : '—'}</div>
                    <div><span className="text-muted-foreground">Salida:</span> {detalle.fechas.salida_at ? new Date(detalle.fechas.salida_at).toLocaleString('es-PE') : '—'}</div>
                    <div><span className="text-muted-foreground">Duración:</span> {(() => { const m=detalle.duracion_minutos||0; const h=Math.floor(m/60); const mm=m%60; return m>0?`${h}h ${mm}m`:'—'; })()}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium mb-1">Comprobante</div>
                    <div><span className="text-muted-foreground">Monto:</span> {detalle.pago?.monto != null ? `S/. ${Number(detalle.pago.monto).toFixed(2)}` : '—'}</div>
                    <div><span className="text-muted-foreground">Estado:</span> {detalle.pago?.estado || '—'}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Método:</span> 
                      {detalle.pago?.metodo ? (
                        <span className="flex items-center gap-1">
                          {iconByMetodo(detalle.pago.metodo_tipo)}
                          <span>{detalle.pago.metodo}</span>
                        </span>
                      ) : '—'}
                    </div>
                    <div><span className="text-muted-foreground">Emitido:</span> {detalle.pago?.comprobante?.emitido_en ? new Date(detalle.pago.comprobante.emitido_en).toLocaleString('es-PE') : '—'}</div>
                    <div><span className="text-muted-foreground">Tipo:</span> {detalle.pago?.comprobante?.tipo || '—'}</div>
                    <div><span className="text-muted-foreground">Serie:</span> {detalle.pago?.comprobante?.serie || '—'}</div>
                    <div><span className="text-muted-foreground">Número:</span> {detalle.pago?.comprobante?.numero ?? '—'}</div>
                    <div className="mt-3">
                      <div className="font-medium mb-1 flex items-center gap-1"><Clock className="h-4 w-4" /> Línea de tiempo</div>
                      <div className="space-y-1">
                        {(!detalle.timeline || detalle.timeline.length === 0) && (
                          <div className="text-muted-foreground">Sin eventos</div>
                        )}
                        {(detalle.timeline || buildTimeline(detalle)).map(ev => (
                          <div key={ev.key+ev.at} className="flex items-center justify-between border rounded-md px-2 py-1">
                            <div className="text-sm">{ev.label}</div>
                            <div className="text-xs text-muted-foreground">{ev.at ? new Date(ev.at).toLocaleString('es-PE') : '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setDetalle(null)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  );
}
