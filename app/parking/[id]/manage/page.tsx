"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard, useAuth } from "@/components/auth-guard"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCcw, Plus, Edit, Trash2, ParkingCircle, Lock, Unlock } from "lucide-react"
import { listTarifasByParking, createTarifa, updateTarifa, deleteTarifa, type TarifaRecord } from "@/lib/tarifas"
import { listSpacesByParking, toggleSpaceEnabled, type SpaceRecord } from "@/lib/spaces"

export default function ManageParkingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const parkingId = useMemo(() => Number(params?.id), [params?.id])

  const canManage = user?.rol === "admin_general" || user?.rol === "admin_parking"

  // State: Tarifas
  const [tarifas, setTarifas] = useState<TarifaRecord[]>([])
  const [tLoading, setTLoading] = useState(false)
  const [isTarifaDialogOpen, setIsTarifaDialogOpen] = useState(false)
  const [editingTarifa, setEditingTarifa] = useState<TarifaRecord | null>(null)
  const [tarifaForm, setTarifaForm] = useState<{ tipo: string; monto: string; condiciones: string }>({ tipo: "hora", monto: "", condiciones: "" })
  const [tarifaError, setTarifaError] = useState<string>("")
  const [isSubmittingTarifa, setIsSubmittingTarifa] = useState(false)

  // State: Espacios
  const [spaces, setSpaces] = useState<SpaceRecord[]>([])
  const [sLoading, setSLoading] = useState(false)
  const [spaceQuery, setSpaceQuery] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [spaceError, setSpaceError] = useState<string>("")

  const filteredSpaces = useMemo(() => {
    const q = spaceQuery.trim().toLowerCase()
    if (!q) return spaces
    return spaces.filter(s => String(s.numero_espacio).toLowerCase().includes(q) || String(s.estado).toLowerCase().includes(q))
  }, [spaces, spaceQuery])

  const totalPages = Math.max(1, Math.ceil(filteredSpaces.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pagedSpaces = filteredSpaces.slice(start, end)

  // Effects: initial load
  useEffect(() => {
    if (!parkingId) return
    void reloadTarifas()
    void reloadSpaces()
  }, [parkingId])

  // Handlers: Tarifas
  const reloadTarifas = async () => {
    if (!parkingId) return
    try {
      setTLoading(true)
      const data = await listTarifasByParking(parkingId)
      setTarifas(Array.isArray(data) ? data : [])
    } finally {
      setTLoading(false)
    }
  }

  const openCreateTarifa = () => {
    setEditingTarifa(null)
    setTarifaForm({ tipo: "hora", monto: "", condiciones: "" })
    setTarifaError("")
    setIsSubmittingTarifa(false)
    setIsTarifaDialogOpen(true)
  }

  const openEditTarifa = (t: TarifaRecord) => {
    setEditingTarifa(t)
    setTarifaForm({ tipo: t.tipo || "hora", monto: String(t.monto ?? ""), condiciones: t.condiciones || "" })
    setTarifaError("")
    setIsSubmittingTarifa(false)
    setIsTarifaDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsTarifaDialogOpen(false)
    setEditingTarifa(null)
    setTarifaError("")
    setIsSubmittingTarifa(false)
  }

  const submitTarifa = async () => {
    if (!parkingId) return
    setTarifaError("")
    setIsSubmittingTarifa(true)
    const payload = {
      tipo: tarifaForm.tipo,
      monto: Number(tarifaForm.monto || 0),
      condiciones: tarifaForm.condiciones?.trim() || undefined,
    }
    try {
      if (editingTarifa) {
        await updateTarifa(parkingId, editingTarifa.id_tarifa, payload)
      } else {
        await createTarifa(parkingId, payload)
      }
      await reloadTarifas()
      setIsTarifaDialogOpen(false)
      setEditingTarifa(null)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error al guardar la tarifa'
      setTarifaError(msg)
    } finally {
      setIsSubmittingTarifa(false)
    }
  }

  const handleDeleteTarifa = async (t: TarifaRecord) => {
    if (!parkingId) return
    setTarifaError("")
    try {
      await deleteTarifa(parkingId, t.id_tarifa)
      await reloadTarifas()
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error al eliminar la tarifa'
      setTarifaError(msg)
    }
  }

  // Handlers: Espacios
  const reloadSpaces = async () => {
    if (!parkingId) return
    try {
      setSLoading(true)
      const data = await listSpacesByParking(parkingId)
      const sorted = (Array.isArray(data) ? data : []).slice().sort((a, b) => {
        const na = parseInt(String(a.numero_espacio).replace(/\D/g, "")) || 0
        const nb = parseInt(String(b.numero_espacio).replace(/\D/g, "")) || 0
        if (na !== nb) return na - nb
        return String(a.numero_espacio).localeCompare(String(b.numero_espacio))
      })
      setSpaces(sorted)
    } finally {
      setSLoading(false)
    }
  }

  const handleToggleEnabled = async (s: SpaceRecord) => {
    if (!parkingId || togglingId) return
    setSpaceError("")
    setTogglingId(s.id_espacio)
    // Optimistic UI
    const prev = spaces
    const nextEstado = s.estado === 'inhabilitado' ? 'disponible' : 'inhabilitado'
    setSpaces(prev.map(x => x.id_espacio === s.id_espacio ? { ...x, estado: nextEstado } : x))
    try {
      await toggleSpaceEnabled(parkingId, s.id_espacio)
      // Poll corto para confirmar el cambio (el backend responde 202 y actualiza en background)
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
      let confirmed = false
      for (let i = 0; i < 6; i++) { // ~2.4s total
        await sleep(400)
        const fresh = await listSpacesByParking(parkingId)
        const sorted = (Array.isArray(fresh) ? fresh : []).slice().sort((a, b) => {
          const na = parseInt(String(a.numero_espacio).replace(/\D/g, "")) || 0
          const nb = parseInt(String(b.numero_espacio).replace(/\D/g, "")) || 0
          if (na !== nb) return na - nb
          return String(a.numero_espacio).localeCompare(String(b.numero_espacio))
        })
        const target = sorted.find(x => x.id_espacio === s.id_espacio)
        if (target && target.estado === nextEstado) {
          setSpaces(sorted)
          confirmed = true
          break
        }
      }
      if (!confirmed) {
        // última recarga por si el cambio llega un poco más tarde
        await reloadSpaces()
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'No se pudo cambiar el estado del espacio'
      setSpaceError(msg)
      // rollback
      setSpaces(prev)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <AuthGuard allowedRoles={["admin_general", "admin_parking"]}>
      <div className="p-6 pt-6">
        <Breadcrumbs items={[{ label: "Mis Parkings", href: "/my-parkings" }, { label: `Gestión avanzada (#${parkingId || "—"})` }]} />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Gestión avanzada del parking</h1>
              <p className="text-muted-foreground">Configura tarifas y administra espacios para este parking</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push("/my-parkings")}>Volver</Button>
              <Button variant="ghost" size="icon" onClick={() => router.refresh()}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!canManage ? (
            <Card>
              <CardHeader>
                <CardTitle>Sin permisos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No tienes permisos para gestionar este parking.</p>
              </CardContent>
            </Card>
          ) : null}

          {canManage ? (
            <>
              <Tabs defaultValue="tarifas" className="w-full">
                <TabsList>
                  <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
                  <TabsTrigger value="espacios">Espacios</TabsTrigger>
                </TabsList>

                <TabsContent value="tarifas" className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Tarifas</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => void reloadTarifas()} disabled={tLoading}>
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => openCreateTarifa()}>
                          <Plus className="h-4 w-4 mr-1" /> Nueva tarifa
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Condiciones</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tarifas.map(t => (
                              <TableRow key={t.id_tarifa}>
                                <TableCell className="font-medium">{t.tipo}</TableCell>
                                <TableCell>S/. {Number(t.monto).toFixed(2)}</TableCell>
                                <TableCell className="max-w-md truncate">{t.condiciones || "—"}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => openEditTarifa(t)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => void handleDeleteTarifa(t)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {tarifas.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Sin tarifas</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                  {tarifaError && (
                    <div className="mt-3 text-sm text-red-600">{tarifaError}</div>
                  )}
                </TabsContent>

                <TabsContent value="espacios" className="space-y-4">
                  <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Espacios</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="hidden md:block text-sm text-muted-foreground mr-2">{filteredSpaces.length} espacios</div>
                      <Badge variant="secondary">Parking #{parkingId || "—"}</Badge>
                      <div className="w-40">
                        <Input placeholder="Buscar..." value={spaceQuery} onChange={e => setSpaceQuery(e.target.value)} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => void reloadSpaces()} disabled={sLoading}>
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedSpaces.map(s => (
                            <TableRow key={s.id_espacio} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{s.numero_espacio}</TableCell>
                              <TableCell>
                                {s.estado === 'disponible' && (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Disponible</Badge>
                                )}
                                {s.estado === 'ocupado' && (
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Ocupado</Badge>
                                )}
                                {s.estado !== 'disponible' && s.estado !== 'ocupado' && (
                                  <Badge variant="outline" className="text-muted-foreground capitalize">{s.estado}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {(() => {
                                  const busy = togglingId === s.id_espacio
                                  const blocked = s.estado === 'ocupado' || s.estado === 'reservado'
                                  const title = blocked ? `No disponible mientras está '${s.estado}'.` : (s.estado === 'inhabilitado' ? 'Habilitar' : 'Deshabilitar')
                                  const isEnable = s.estado === 'inhabilitado'
                                  return (
                                    <Button
                                      variant={isEnable ? 'outline' : 'ghost'}
                                      size="sm"
                                      className={isEnable ? 'text-green-700 border-green-200 hover:bg-green-50' : 'text-yellow-700 hover:text-yellow-800'}
                                      title={title}
                                      disabled={busy || blocked}
                                      onClick={() => void handleToggleEnabled(s)}
                                    >
                                      {isEnable ? <Unlock className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
                                      {isEnable ? 'Habilitar' : 'Deshabilitar'}
                                    </Button>
                                  )
                                })()}
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredSpaces.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="py-12">
                                <div className="flex flex-col items-center justify-center text-center gap-2">
                                  <ParkingCircle className="h-10 w-10 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">No se encontraron espacios</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {spaceError && (
                      <div className="mt-3 text-sm text-red-600">{spaceError}</div>
                    )}
                    {/* Pagination */}
                    {filteredSpaces.length > 0 && (
                      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                          Mostrando {filteredSpaces.length === 0 ? 0 : start + 1}–{Math.min(end, filteredSpaces.length)} de {filteredSpaces.length}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
                          <div>Página {currentPage} de {totalPages}</div>
                          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </TabsContent>
              </Tabs>
              {/* Dialogo de Tarifa */}
              <Dialog open={isTarifaDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>{editingTarifa ? 'Editar tarifa' : 'Nueva tarifa'}</DialogTitle>
                    <DialogDescription>Define tipo, monto y condiciones de la tarifa.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm" htmlFor="tipo">Tipo</label>
                      <div className="col-span-3">
                        <Input id="tipo" value={tarifaForm.tipo} onChange={e => setTarifaForm(v => ({ ...v, tipo: e.target.value }))} placeholder="hora | dia | mes" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm" htmlFor="monto">Monto</label>
                      <div className="col-span-3">
                        <Input id="monto" type="number" step="0.01" value={tarifaForm.monto} onChange={e => setTarifaForm(v => ({ ...v, monto: e.target.value }))} placeholder="0.00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm" htmlFor="condiciones">Condiciones</label>
                      <div className="col-span-3">
                        <Textarea id="condiciones" value={tarifaForm.condiciones} onChange={e => setTarifaForm(v => ({ ...v, condiciones: e.target.value }))} placeholder="Texto libre (opcional)" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsTarifaDialogOpen(false); setEditingTarifa(null); setTarifaError(""); setIsSubmittingTarifa(false); }} disabled={isSubmittingTarifa}>Cancelar</Button>
                    <Button onClick={() => void submitTarifa()} disabled={isSubmittingTarifa}>
                      {isSubmittingTarifa ? 'Procesando...' : (editingTarifa ? 'Guardar' : 'Crear')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  )
}

// Diálogo de tarifa
// Nota: al estar fuera del JSX principal, lo incluimos directamente dentro del componente más arriba si se requiere dividir.
