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
  customLabel?: string
}

export default function StatusBadge({ status, variant = 'default', className = '', customLabel }: Props) {
  const validStatus = (status && (status === 'green' || status === 'yellow' || status === 'red')) ? status : 'green'
  if (!status || !config[status]) {
    console.warn('[StatusBadge] Invalid status value:', status, 'falling back to green')
  }
  const { bg, text, dot } = config[validStatus]

  const label =
    customLabel ? customLabel :
    variant === 'work'        ? (workLabels[validStatus] ?? config[validStatus].label) :
    variant === 'publication' ? (pubLabels[validStatus]  ?? config[validStatus].label) :
    variant === 'book'        ? (bookLabels[validStatus] ?? config[validStatus].label) :
    config[validStatus].label

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-semibold ${bg} ${text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  )
}
