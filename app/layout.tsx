import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

export const metadata: Metadata = {
  title: "ParkManager - Sistema de Gestión de Estacionamientos",
  description: "Sistema profesional para la gestión de estacionamientos",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AppShell>
          <Suspense fallback={null}>{children}</Suspense>
        </AppShell>
        <Analytics />
      </body>
    </html>
  )
}
