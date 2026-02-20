export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="spinner" aria-hidden />
      {message && (
        <p className="mt-2 text-slate-600 font-medium">{message}</p>
      )}
    </div>
  )
}
