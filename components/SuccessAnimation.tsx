"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, X } from "lucide-react"
import { Button } from "./ui/button"

interface SuccessAnimationProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  duration?: number
  useAnimation?: boolean
  animationSrc?: string
}

export default function SuccessAnimation({
  isOpen,
  onClose,
  title,
  message,
  duration = 3000,
  useAnimation = false,
    animationSrc = "/animations/car.gif"
}: SuccessAnimationProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="success-title"
      aria-describedby={message ? "success-message" : undefined}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center text-center">
          {useAnimation ? (
            <>
              <img 
                src={animationSrc}
                alt="Éxito"
                className="w-[200px] h-[200px] mb-4"
                onError={() => {
                  console.error('[SuccessAnimation] No se pudo cargar la animación:', animationSrc)
                  setImgError(true)
                }}
                onLoad={() => setImgLoaded(true)}
              />
              {/* Diagnóstico: si hay error, mostramos fallback ícono */}
              {imgError && (
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 mb-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
              )}
            </>
          ) : (
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          )}

          <h2 id="success-title" className="text-2xl font-bold mb-2">{title}</h2>
          
          {message && (
            <p id="success-message" className="text-muted-foreground mb-6">{message}</p>
          )}

          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-700 hover:to-emerald-600 shadow-md hover:shadow-lg transition-colors"
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  )
}
