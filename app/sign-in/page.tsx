import { Suspense } from "react"
import { AuthForms } from "@/components/auth-forms"

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>}>
      <AuthForms defaultTab="login" />
    </Suspense>
  )
}

