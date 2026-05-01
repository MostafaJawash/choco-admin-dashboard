export default function FormField({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      {children}
    </label>
  )
}
