import React from 'react';

export default function ChipSelect({ options, value = [], onChange, columns = 2 }) {
  const toggle = (option) => {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };

  return (
    <div className={`grid gap-1.5 ${columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`text-left text-xs px-2.5 py-2 rounded-lg border transition-colors ${
              selected
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}