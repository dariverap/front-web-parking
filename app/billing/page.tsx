"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, DollarSign, Clock, Search, Calculator, Receipt, CheckCircle, AlertCircle } from "lucide-react"

const mockActiveCustomers = [
  {
    id: "C001",
    spaceId: "A001",
    vehiclePlate: "1234ABC",
    customerName: "Juan García",
    customerPhone: "+34 666 123 456",
    entryTime: "2024-01-15 08:30",
    duration: "4h 15m",
    rate: "2.50",
    totalAmount: "10.63",
    status: "active",
  },
  {
    id: "C002",
    spaceId: "B002",
    vehiclePlate: "5678DEF",
    customerName: "Carlos Ruiz",
    customerPhone: "+34 666 345 678",
    entryTime: "2024-01-15 10:15",
    duration: "2h 30m",
    rate: "2.50",
    totalAmount: "6.25",
    status: "active",
  },
  {
    id: "C003",
    spaceId: "A003",
    vehiclePlate: "9012GHI",
    customerName: "María López",
    customerPhone: "+34 666 789 012",
    entryTime: "2024-01-15 12:00",
    duration: "1h 45m",
    rate: "2.50",
    totalAmount: "4.38",
    status: "ready_to_pay",
  },
]

const mockTransactions = [
  {
    id: "T001",
    spaceId: "A005",
    vehiclePlate: "3456JKL",
    customerName: "Ana Martín",
    amount: "8.75",
    paymentMethod: "cash",
    duration: "3h 30m",
    timestamp: "2024-01-15 14:30",
    employeeName: "Juan Pérez",
  },
  {
    id: "T002",
    spaceId: "B001",
    vehiclePlate: "7890MNO",
    customerName: "Pedro Sánchez",
    amount: "12.50",
    paymentMethod: "card",
    duration: "5h 00m",
    timestamp: "2024-01-15 13:15",
    employeeName: "Juan Pérez",
  },
  {
    id: "T003",
    spaceId: "A002",
    vehiclePlate: "2468PQR",
    customerName: "Laura Fernández",
    amount: "5.25",
    paymentMethod: "cash",
    duration: "2h 06m",
    timestamp: "2024-01-15 12:45",
    employeeName: "Juan Pérez",
  },
]

const rates = {
  hourly: 2.5,
  daily: 15.0,
  monthly: 120.0,
}

function BillingPageContent() {
  const [activeCustomers, setActiveCustomers] = useState(mockActiveCustomers)
  const [transactions, setTransactions] = useState(mockTransactions)
  const [filteredCustomers, setFilteredCustomers] = useState(mockActiveCustomers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isCalculatorDialogOpen, setIsCalculatorDialogOpen] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "",
    discount: "",
    notes: "",
  })
  const [calculatorData, setCalculatorData] = useState({
    hours: "",
    minutes: "",
    rateType: "hourly",
    customRate: "",
  })

  const applyFilters = () => {
    let filtered = activeCustomers

    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.spaceId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredCustomers(filtered)
  }

  const calculateAmount = () => {
    const hours = Number.parseInt(calculatorData.hours) || 0
    const minutes = Number.parseInt(calculatorData.minutes) || 0
    const totalHours = hours + minutes / 60

    let amount = 0
    if (calculatorData.rateType === "hourly") {
      amount = totalHours * rates.hourly
    } else if (calculatorData.rateType === "daily") {
      amount = Math.ceil(totalHours / 24) * rates.daily
    } else if (calculatorData.rateType === "custom") {
      const customRate = Number.parseFloat(calculatorData.customRate) || 0
      amount = totalHours * customRate
    }

    return amount.toFixed(2)
  }

  const processPayment = () => {
    const newTransaction = {
      id: `T${Date.now()}`,
      spaceId: selectedCustomer.spaceId,
      vehiclePlate: selectedCustomer.vehiclePlate,
      customerName: selectedCustomer.customerName,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      duration: selectedCustomer.duration,
      timestamp: new Date().toLocaleString(),
      employeeName: "Juan Pérez", // This would come from auth context
    }

    // Add to transactions
    setTransactions([newTransaction, ...transactions])

    // Remove from active customers
    setActiveCustomers(activeCustomers.filter((c) => c.id !== selectedCustomer.id))
    setFilteredCustomers(filteredCustomers.filter((c) => c.id !== selectedCustomer.id))

    setIsPaymentDialogOpen(false)
    setPaymentData({ amount: "", paymentMethod: "", discount: "", notes: "" })
  }

  const openPaymentDialog = (customer: any) => {
    setSelectedCustomer(customer)
    setPaymentData({
      amount: customer.totalAmount,
      paymentMethod: "",
      discount: "",
      notes: "",
    })
    setIsPaymentDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Activo</Badge>
      case "ready_to_pay":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Listo para Pagar</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Vencido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cash":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Efectivo</Badge>
      case "card":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Tarjeta</Badge>
      case "transfer":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Transferencia</Badge>
      default:
        return <Badge variant="secondary">{method}</Badge>
    }
  }

  const applyDiscount = () => {
    const originalAmount = Number.parseFloat(selectedCustomer.totalAmount)
    const discountPercent = Number.parseFloat(paymentData.discount) || 0
    const discountAmount = (originalAmount * discountPercent) / 100
    const finalAmount = originalAmount - discountAmount
    setPaymentData({ ...paymentData, amount: finalAmount.toFixed(2) })
  }

  const todayTotal = transactions
    .filter((t) => t.timestamp.startsWith("2024-01-15"))
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 overflow-auto">
        <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs items={[{ label: "Cobros" }]} />

          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-balance">Sistema de Cobros</h1>
                <p className="text-muted-foreground mt-2">Procesa pagos y gestiona transacciones</p>
              </div>

              <Button
                onClick={() => setIsCalculatorDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculadora de Tarifas
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCustomers.length}</div>
                  <p className="text-xs text-muted-foreground">En el parking</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes de Pago</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {activeCustomers.filter((c) => c.status === "ready_to_pay").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Listos para cobrar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cobros de Hoy</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {transactions.filter((t) => t.timestamp.startsWith("2024-01-15")).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Transacciones</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Hoy</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">S/. {todayTotal.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Ingresos del día</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por matrícula, cliente o espacio..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      applyFilters()
                    }}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Active Customers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Clientes Activos ({filteredCustomers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Espacio</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Tarifa</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.spaceId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {customer.vehiclePlate}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{customer.customerName}</div>
                              <div className="text-xs text-muted-foreground">{customer.customerPhone}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{customer.entryTime}</TableCell>
                          <TableCell className="font-medium">{customer.duration}</TableCell>
                          <TableCell>S/. {customer.rate}/h</TableCell>
                          <TableCell className="font-bold text-green-600">S/. {customer.totalAmount}</TableCell>
                          <TableCell>{getStatusBadge(customer.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => openPaymentDialog(customer)}
                            >
                              <CreditCard className="mr-1 h-3 w-3" />
                              Cobrar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Empleado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 10).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {transaction.vehiclePlate}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{transaction.customerName}</TableCell>
                          <TableCell className="text-sm">{transaction.duration}</TableCell>
                          <TableCell>{getPaymentMethodBadge(transaction.paymentMethod)}</TableCell>
                          <TableCell className="font-bold text-green-600">S/. {transaction.amount}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{transaction.timestamp}</TableCell>
                          <TableCell className="text-sm">{transaction.employeeName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Cliente: {selectedCustomer?.customerName} - Vehículo: {selectedCustomer?.vehiclePlate}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Duración</Label>
                <p className="text-lg font-bold">{selectedCustomer?.duration}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tarifa</Label>
                <p className="text-lg">S/. {selectedCustomer?.rate}/hora</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discount">Descuento (%)</Label>
                <div className="flex gap-2">
                  <Input
                    id="discount"
                    type="number"
                    value={paymentData.discount}
                    onChange={(e) => setPaymentData({ ...paymentData, discount: e.target.value })}
                    placeholder="0"
                  />
                  <Button size="sm" variant="outline" onClick={applyDiscount}>
                    Aplicar
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Monto Final</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="font-bold text-lg"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Método de Pago</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="Información adicional..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={processPayment}
              className="bg-green-600 hover:bg-green-700"
              disabled={!paymentData.paymentMethod || !paymentData.amount}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Procesar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculator Dialog */}
      <Dialog open={isCalculatorDialogOpen} onOpenChange={setIsCalculatorDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Calculadora de Tarifas</DialogTitle>
            <DialogDescription>Calcula el monto a cobrar según el tiempo de estacionamiento</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hours">Horas</Label>
                <Input
                  id="hours"
                  type="number"
                  value={calculatorData.hours}
                  onChange={(e) => setCalculatorData({ ...calculatorData, hours: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minutes">Minutos</Label>
                <Input
                  id="minutes"
                  type="number"
                  value={calculatorData.minutes}
                  onChange={(e) => setCalculatorData({ ...calculatorData, minutes: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rateType">Tipo de Tarifa</Label>
              <Select
                value={calculatorData.rateType}
                onValueChange={(value) => setCalculatorData({ ...calculatorData, rateType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Por Hora (S/. {rates.hourly})</SelectItem>
                  <SelectItem value="daily">Por Día (S/. {rates.daily})</SelectItem>
                  <SelectItem value="custom">Tarifa Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {calculatorData.rateType === "custom" && (
              <div className="grid gap-2">
                <Label htmlFor="customRate">Tarifa Personalizada (S/. /hora)</Label>
                <Input
                  id="customRate"
                  type="number"
                  step="0.01"
                  value={calculatorData.customRate}
                  onChange={(e) => setCalculatorData({ ...calculatorData, customRate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total a Cobrar:</span>
                <span className="text-2xl font-bold text-green-600">S/. {calculateAmount()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalculatorDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BillingPage() {
  return (
    <AuthGuard allowedRoles={["empleado"]}>
      <BillingPageContent />
    </AuthGuard>
  )
}
