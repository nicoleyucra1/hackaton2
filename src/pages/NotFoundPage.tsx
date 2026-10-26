import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-6xl font-black text-amber-400">404</p>
        <p className="mt-2 text-slate-300">Esta isla no aparece en ningún mapa.</p>
        <Link to="/" className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-950">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
