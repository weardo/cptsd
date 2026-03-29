'use client';

interface SafeSpaceToggleProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function SafeSpaceToggle({ options, selected, onChange }: SafeSpaceToggleProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const isActive = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              isActive
                ? 'bg-secondary-fixed text-on-secondary-container'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
