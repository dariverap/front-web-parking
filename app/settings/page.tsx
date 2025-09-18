"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Bell, Shield, Palette, Save } from "lucide-react"

// Mock user data
const mockUser = {
  name: "Carlos García",
  email: "carlos.garcia@email.com",
  role: "admin_parking",
  phone: "+34 91 123 4567",
  avatar: null,
}

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useState({
    name: mockUser.name,
    email: mockUser.email,
    phone: mockUser.phone,
    bio: "Administrador de estacionamientos con 5 años de experiencia.",
    language: "es",
    timezone: "Europe/Madrid",
  })

  const [notifications, setNotifications] = useState({
    emailReservations: true,
    emailPayments: true,
    emailReports: false,
    pushReservations: true,
    pushPayments: false,
    pushAlerts: true,
  })

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: "30",
    loginAlerts: true,
  })

  const [appearance, setAppearance] = useState({
    theme: "light",
    language: "es",
    compactMode: false,
  })

  const handleSaveProfile = () => {
    // In a real app, this would make an API call
    console.log("Saving profile:", userSettings)
    // Show success message
  }

  const handleSaveNotifications = () => {
    console.log("Saving notifications:", notifications)
  }

  const handleSaveSecurity = () => {
    console.log("Saving security:", security)
  }

  const handleSaveAppearance = () => {
    console.log("Saving appearance:", appearance)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole="admin_parking" />

      <main className="flex-1 ml-0 md:ml-64 overflow-auto">
        <div className="p-6 pt-16 md:pt-6">
          <Breadcrumbs items={[{ label: "Configuración" }]} />

          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-balance">Configuración</h1>
              <p className="text-muted-foreground mt-2">Gestiona tu cuenta y preferencias del sistema</p>
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Seguridad
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Apariencia
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-foreground">
                          {userSettings.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">
                          Cambiar Foto
                        </Button>
                        <p className="text-sm text-muted-foreground">JPG, PNG o GIF. Máximo 2MB.</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input
                          id="name"
                          value={userSettings.name}
                          onChange={(e) => setUserSettings({ ...userSettings, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userSettings.email}
                          onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={userSettings.phone}
                          onChange={(e) => setUserSettings({ ...userSettings, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">Admin Parking</Badge>
                          <span className="text-sm text-muted-foreground">Contacta al administrador para cambios</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografía</Label>
                      <Textarea
                        id="bio"
                        value={userSettings.bio}
                        onChange={(e) => setUserSettings({ ...userSettings, bio: e.target.value })}
                        placeholder="Cuéntanos sobre ti..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="language">Idioma</Label>
                        <Select
                          value={userSettings.language}
                          onValueChange={(value) => setUserSettings({ ...userSettings, language: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Zona Horaria</Label>
                        <Select
                          value={userSettings.timezone}
                          onValueChange={(value) => setUserSettings({ ...userSettings, timezone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                            <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                            <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Preferencias de Notificaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notificaciones por Email</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Nuevas Reservas</p>
                            <p className="text-sm text-muted-foreground">
                              Recibe un email cuando se haga una nueva reserva
                            </p>
                          </div>
                          <Switch
                            checked={notifications.emailReservations}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, emailReservations: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Pagos Procesados</p>
                            <p className="text-sm text-muted-foreground">Notificaciones cuando se procesen pagos</p>
                          </div>
                          <Switch
                            checked={notifications.emailPayments}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, emailPayments: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Reportes Semanales</p>
                            <p className="text-sm text-muted-foreground">Resumen semanal de actividad</p>
                          </div>
                          <Switch
                            checked={notifications.emailReports}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, emailReports: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notificaciones Push</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Reservas en Tiempo Real</p>
                            <p className="text-sm text-muted-foreground">Notificaciones instantáneas de reservas</p>
                          </div>
                          <Switch
                            checked={notifications.pushReservations}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, pushReservations: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Alertas de Sistema</p>
                            <p className="text-sm text-muted-foreground">Alertas importantes del sistema</p>
                          </div>
                          <Switch
                            checked={notifications.pushAlerts}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, pushAlerts: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveNotifications}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Preferencias
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Configuración de Seguridad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Autenticación de Dos Factores</p>
                            <p className="text-sm text-muted-foreground">
                              Añade una capa extra de seguridad a tu cuenta
                            </p>
                          </div>
                          <Switch
                            checked={security.twoFactor}
                            onCheckedChange={(checked) => setSecurity({ ...security, twoFactor: checked })}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                          <Select
                            value={security.sessionTimeout}
                            onValueChange={(value) => setSecurity({ ...security, sessionTimeout: value })}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 minutos</SelectItem>
                              <SelectItem value="30">30 minutos</SelectItem>
                              <SelectItem value="60">1 hora</SelectItem>
                              <SelectItem value="120">2 horas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Alertas de Inicio de Sesión</p>
                            <p className="text-sm text-muted-foreground">
                              Recibe alertas cuando alguien acceda a tu cuenta
                            </p>
                          </div>
                          <Switch
                            checked={security.loginAlerts}
                            onCheckedChange={(checked) => setSecurity({ ...security, loginAlerts: checked })}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={handleSaveSecurity}>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Configuración
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cambiar Contraseña</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                      <Button>Cambiar Contraseña</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Personalización de la Interfaz
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Tema</Label>
                        <Select
                          value={appearance.theme}
                          onValueChange={(value) => setAppearance({ ...appearance, theme: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Claro</SelectItem>
                            <SelectItem value="dark">Oscuro</SelectItem>
                            <SelectItem value="system">Sistema</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="interfaceLanguage">Idioma de la Interfaz</Label>
                        <Select
                          value={appearance.language}
                          onValueChange={(value) => setAppearance({ ...appearance, language: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Modo Compacto</p>
                          <p className="text-sm text-muted-foreground">
                            Reduce el espaciado para mostrar más información
                          </p>
                        </div>
                        <Switch
                          checked={appearance.compactMode}
                          onCheckedChange={(checked) => setAppearance({ ...appearance, compactMode: checked })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveAppearance}>
                        <Save className="mr-2 h-4 w-4" />
                        Aplicar Cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
