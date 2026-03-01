import { getInitials, getAvatarColor } from '../../utils/helpers'

export default function Avatar({ name = '', size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold shrink-0 ${sizes[size]} ${getAvatarColor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}
