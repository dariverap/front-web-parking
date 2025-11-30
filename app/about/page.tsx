"use client"

import { Github, Code2, Users, Rocket, Heart } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const developers = [
    "Rivera Picoy, Diego Armando",
    "Coronel Camones, Anthony Jesús",
    "García Gutiérrez, Jesus Martin",
    "Pérez Páez, Luis Manuel",
    "Coronel Castillo, Enrique Alexis"
  ];

  const techStack = [
    { name: "Frontend Web", tech: "Next.js 14", color: "bg-blue-500", textColor: "text-blue-600" },
    { name: "Frontend Móvil", tech: "React Native", color: "bg-green-500", textColor: "text-green-600" },
    { name: "Backend", tech: "Node.js + Express", color: "bg-purple-500", textColor: "text-purple-600" },
    { name: "Base de Datos", tech: "PostgreSQL", color: "bg-orange-500", textColor: "text-orange-600" },
    { name: "Autenticación", tech: "Supabase Auth", color: "bg-pink-500", textColor: "text-pink-600" },
    { name: "Cloud", tech: "Azure", color: "bg-indigo-500", textColor: "text-indigo-600" },
  ];

  return (
    <div className="p-6 pt-16 md:pt-6">
      <Breadcrumbs items={[{ label: "Acerca de" }]} />
      
      <div className="space-y-6">
      
        {/* Header con ícono */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ParkingSys</h1>
              <p className="text-muted-foreground">
                Sistema Inteligente de Gestión de Estacionamientos
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm w-fit h-fit">
            Versión 1.0.0
          </Badge>
        </div>

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Columna izquierda */}
          <div className="flex flex-col gap-6">
            
            {/* Sobre el Proyecto */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  <CardTitle>Sobre el Proyecto</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  ParkingSys es una solución innovadora diseñada para optimizar la gestión de espacios de estacionamiento 
                  en tiempo real. Desarrollado con tecnologías modernas, ofrece una experiencia fluida tanto en web como 
                  en dispositivos móviles.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  El sistema permite a los usuarios reservar espacios, gestionar ocupaciones, procesar pagos y generar 
                  comprobantes electrónicos de manera automática.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Proyecto universitario desarrollado para el curso Integrador I, bajo la guía de la profesora 
                  Claudia Yolanda Villalta Flores, aplicando la metodología Scrum.
                </p>
              </CardContent>
            </Card>

            {/* Tecnologías */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle>Tecnologías Utilizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {techStack.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                      <div className="min-w-0">
                        <div className={`font-medium text-sm truncate ${item.textColor}`}>{item.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.tech}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-6">

            {/* Equipo de Desarrollo */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle>Scrum Team</CardTitle>
                </div>
                <CardDescription>
                  <span className="text-primary font-semibold">Grupo: Los Galácticos</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {developers.map((dev, index) => {
                    const initial = dev.split(',')[0].charAt(0);
                    return (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                      >
                        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                          {initial}
                        </div>
                        <span className="font-medium text-sm truncate">{dev}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* GitHub */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  <CardTitle>Código Fuente</CardTitle>
                </div>
                <CardDescription>
                  El código está disponible públicamente en GitHub
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-3">
                      Desarrollado por <span className="font-semibold text-foreground">Diego Rivera</span>
                    </p>
                    <Button asChild size="sm">
                      <a 
                        href="https://github.com/dariverap" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2"
                      >
                        <Github className="w-4 h-4" />
                        Ver en GitHub
                      </a>
                    </Button>
                  </div>
                  <Github className="w-16 h-16 text-muted-foreground/10" />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-sm text-muted-foreground border-t">
          <p className="flex items-center justify-center gap-1">
            © 2025 ParkingSys · Desarrollado con <Heart className="w-4 h-4 text-red-500 fill-red-500" /> por Los Galácticos
          </p>
        </div>

      </div>
    </div>
  );
}
