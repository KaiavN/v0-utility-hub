import type React from "react"

interface SectionHeaderProps {
  title: string
  count?: number
  actions?: React.ReactNode
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count, actions }) => {
  return (
    <div className="section-header">
      <div className="section-title">
        <h2>{title}</h2>
        {count !== undefined && <span className="section-count">({count})</span>}
      </div>
      {actions && <div className="section-actions">{actions}</div>}
    </div>
  )
}

export default SectionHeader
