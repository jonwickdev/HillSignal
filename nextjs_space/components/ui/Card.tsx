import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-hill-dark border border-hill-border rounded-lg p-6 ${
        hover
          ? 'hover:border-hill-orange hover:shadow-[0_0_20px_rgba(255,107,0,0.1)] transition-all duration-300 cursor-pointer'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
