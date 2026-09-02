import { ChevronRight } from 'lucide-react'

export function SectionTitle({
  label,
  action,
  onClick,
}: {
  label: string
  action: string
  onClick: () => void
}) {
  return (
    <div className="section-title">
      <h2>{label}</h2>
      <button onClick={onClick}>
        {action} <ChevronRight size={14} />
      </button>
    </div>
  )
}
