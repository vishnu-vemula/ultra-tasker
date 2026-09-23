export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
    </div>
  )
}
