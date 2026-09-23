import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card'

interface FirebaseSetupNoticeProps {
  error: string
}

export function FirebaseSetupNotice({ error }: FirebaseSetupNoticeProps) {
  return (
    <Card className="w-full max-w-md border-amber-200 bg-amber-50/50 shadow-lg shadow-slate-200/50">
      <CardHeader className="items-center pb-0">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </span>
        <CardTitle className="text-xl">Firebase is not configured</CardTitle>
        <CardDescription className="text-center">
          Authentication can&apos;t start until the Firebase credentials are set up.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-100/60 px-3 py-2 font-mono text-xs text-amber-800">
          {error}
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Copy <code className="rounded bg-secondary px-1 font-mono text-xs">frontend/.env.example</code>{' '}
            to <code className="rounded bg-secondary px-1 font-mono text-xs">frontend/.env</code>
          </li>
          <li>
            Fill in the <code className="rounded bg-secondary px-1 font-mono text-xs">NEXT_PUBLIC_FIREBASE_*</code>{' '}
            values from Firebase Console → Project settings → General → Your apps → Config
          </li>
          <li>
            Restart <code className="rounded bg-secondary px-1 font-mono text-xs">npm run dev</code>
          </li>
        </ol>
      </CardContent>
    </Card>
  )
}
