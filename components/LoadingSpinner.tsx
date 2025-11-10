"use client"

import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
  useAnimation?: boolean
}

export default function LoadingSpinner({ 
  message = "Cargando...", 
  size = "md",
  useAnimation = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  }

  const containerClasses = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12"
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      {useAnimation ? (
        <img 
          src="/animations/loading.gif" 
          alt="Cargando" 
          className={`${sizeClasses[size]} mb-3`}
        />
      ) : (
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mb-3`} />
      )}
      {message && (
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
      )}
    </div>
  )
}
