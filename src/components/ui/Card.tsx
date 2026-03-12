import { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false, ...props }: CardProps) {
  return (
    <div
      className={`
        bg-hill-dark border border-hill-border rounded-lg p-6
        ${hover ? 'transition-all duration-300 hover:border-hill-orange hover:shadow-[0_0_20px_rgba(255,107,0,0.1)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
