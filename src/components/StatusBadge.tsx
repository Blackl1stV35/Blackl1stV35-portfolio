import type { StatusColor } from '@/types'

const config: Record<StatusColor, { bg: string; text: string; dot: string; label: string }> = {
  green:  { bg: 'bg-green-50',  text: 'text-green-800',  dot: 'bg-green-500',  label: 'Active'      },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'In Progress' },
  red:    { bg: 'bg-red-50',    text: 'text-red-800',    dot: 'bg-red-500',    label: 'Archived'    },
}

const workLabels: Partial<Record<StatusColor, string>> = {
  green: 'Current', yellow: 'Part-time', red: 'Closed',
}
const pubLabels: Partial<Record<StatusColor, string>> = {
  green: 'Published', yellow: 'Under Review', red: 'Retracted',
}
const bookLabels: Partial<Record<StatusColor, string>> = {
  green: 'Read', yellow: 'Reading', red: 'Interested',
}

interface Props {
  status: StatusColor
  variant?: 'default' | 'work' | 'publication' | 'book'
  className?: string
}

export default function StatusBadge({ status, variant = 'default', className = '' }: Props) {
  const { bg, text, dot } = config[status]

  const label =
    variant === 'work'        ? (workLabels[status] ?? config[status].label) :
    variant === 'publication' ? (pubLabels[status]  ?? config[status].label) :
    variant === 'book'        ? (bookLabels[status] ?? config[status].label) :
    config[status].label

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-semibold ${bg} ${text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  )
}
