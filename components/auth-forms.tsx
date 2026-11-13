"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, GraduationCap, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFormsProps {
  defaultTab?: "login" | "signup"
}

function AuthFormsContent({ defaultTab = "login" }: AuthFormsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get("redirect")
  const portalParam = searchParams.get("portal")

  const { login, isLoading, error: authError } = useAuth()
  const [portalRole, setPortalRole] = useState<"student" | "admin">(
    portalParam === "admin" ? "admin" : "student"
  )
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    name: "",
    institution: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync portal param if it changes
  useEffect(() => {
    if (portalParam === "admin") {
      setPortalRole("admin")
    }
  }, [portalParam])

  const handleRoleChange = (role: "student" | "admin") => {
    setPortalRole(role)
    setError("")
    setSuccess("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      const endpoint = portalRole === "admin" ? "/api/auth/admin-login" : "/api/auth/login"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid email or password")
        setIsSubmitting(false)
        return
      }

      // Safe sessionStorage tagging (never throws in Incognito)
      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "chem_active_portal",
            data.role === "admin" || data.role === "staff" ? "admin" : "student"
          )
        }
      } catch (e) {
        // Ignored if storage is restricted in Incognito
      }

      // Role-based destination
      if (data.role === "admin" || data.role === "staff") {
        let dest = "/admin/dashboard"
        if (redirectParam && redirectParam.startsWith("/admin") && !redirectParam.startsWith("//")) {
          dest = redirectParam
        }
        window.location.href = dest
      } else {
        let dest = "/"
        if (
          redirectParam &&
          redirectParam.startsWith("/") &&
          !redirectParam.startsWith("//") &&
          !redirectParam.startsWith("/admin")
        ) {
          dest = redirectParam
        }
        window.location.href = dest
      }
    } catch (err) {
      console.error("Login submission error:", err)
      setError("Network error: Unable to connect to server. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (portalRole === "admin") {
      setError("Staff and Administrator accounts must be created by institution management.")
      return
    }

    if (signupForm.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!signupForm.institution.trim()) {
      setError("Please enter your school or college name")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupForm.email,
          password: signupForm.password,
          name: signupForm.name,
          institution: signupForm.institution,
        }),
      })

      if (response.ok) {
        setSuccess("Account created! Switching to sign in tab...")
        setTimeout(() => {
          setLoginForm({ email: signupForm.email, password: "" })
          setSignupForm({ email: "", password: "", name: "", institution: "" })
          setSuccess("")
          setActiveTab("login")
        }, 1500)
        return
      }

      const data = await response.json()
      if (data.error === "EMAIL_ALREADY_EXISTS") {
        setError("This email is already registered. Please sign in instead.")
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (err) {
      console.error("Signup request failed:", err)
      setError("Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formLoading = isLoading || isSubmitting

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-md border-border/60">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <Image src="/ChemCurious_logo.svg" alt="ChemCurious Logo" width={44} height={44} />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">ChemCurious</CardTitle>
          <CardDescription>
            {portalRole === "admin"
              ? "Staff & Administrator console sign in"
              : "Sign in to track your progress and save your work"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Unified Role Switcher: Student (default) vs Admin / Staff */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/70 rounded-lg border border-border/50">
            <button
              type="button"
              onClick={() => handleRoleChange("student")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer",
                portalRole === "student"
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer",
                portalRole === "admin"
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin / Staff
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={portalRole === "admin" ? "admin@chemistryplayground.org" : "student@example.com"}
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">{error}</p>}
                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {portalRole === "admin" ? "Sign In as Admin" : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {portalRole === "admin" ? (
                <div className="p-4 text-center space-y-3 bg-muted/40 rounded-lg border border-border/50 my-2">
                  <Shield className="h-8 w-8 text-primary mx-auto opacity-80" />
                  <p className="text-sm font-semibold text-foreground">
                    Institutional Accounts
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Staff and Administrator accounts are provisioned directly by institution managers. If you require administrative credentials, please contact your administrator.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("login")}
                    className="mt-2"
                  >
                    Switch to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your full name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-institution">School / College Name</Label>
                    <Input
                      id="signup-institution"
                      type="text"
                      placeholder="School or college"
                      value={signupForm.institution}
                      onChange={(e) => setSignupForm({ ...signupForm, institution: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="student@example.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">{error}</p>}
                  {success && <p className="text-sm text-green-600 bg-green-50 p-2.5 rounded-md border border-green-200">{success}</p>}
                  <Button type="submit" className="w-full" disabled={formLoading}>
                    {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Account
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export function AuthForms(props: AuthFormsProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>}>
      <AuthFormsContent {...props} />
    </Suspense>
  )
}
