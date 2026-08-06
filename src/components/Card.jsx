import { cn } from '../utils/helpers'

export function Card({ children, className, hover = false, onClick, ...props }) {
  return (
    <div
      className={cn('card', hover && 'card-hover', className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return <div className={cn('card-header', className)}>{children}</div>
}

export function CardBody({ children, className }) {
  return <div className={cn('card-body', className)}>{children}</div>
}

export function CardFooter({ children, className }) {
  return <div className={cn('card-footer', className)}>{children}</div>
}
