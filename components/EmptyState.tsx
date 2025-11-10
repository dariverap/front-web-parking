"use client"

import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  useAnimation?: boolean
  animationSrc?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  useAnimation = false,
    animationSrc = "/animations/empty.svg"
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {useAnimation ? (
        <img 
          src={animationSrc}
          alt={title}
          className="w-48 h-48 mb-4 object-contain"
        />
      ) : Icon ? (
        <div className="rounded-full bg-muted p-6 mb-4">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      ) : null}
      
      <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>
      
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}
