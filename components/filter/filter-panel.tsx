"use client"

import type React from "react"

interface FilterOption {
  id: string
  label: string
}

interface FilterPanelProps {
  title: string
  options: FilterOption[]
  selectedOptions: string[]
  onChange: (selectedIds: string[]) => void
}

const FilterPanel: React.FC<FilterPanelProps> = ({ title, options, selectedOptions, onChange }) => {
  const handleChange = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter((id) => id !== optionId)
      : [...selectedOptions, optionId]

    onChange(newSelection)
  }

  return (
    <div className="filter-panel">
      <h3>{title}</h3>
      <div className="filter-options">
        {options.map((option) => (
          <label key={option.id} className="filter-option">
            <input
              type="checkbox"
              checked={selectedOptions.includes(option.id)}
              onChange={() => handleChange(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default FilterPanel
