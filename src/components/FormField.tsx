import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
}

export function FormField({ label, name, error, ...inputProps }: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-300">{label}</span>
      <input
        name={name}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-lg border bg-slate-900 px-3 py-2 outline-none focus:border-amber-400 ${
          error ? 'border-red-500' : 'border-slate-700'
        }`}
        {...inputProps}
      />
      {error && <span className="mt-1 block text-sm text-red-400">{error}</span>}
    </label>
  )
}
