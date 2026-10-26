"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface AuthFormsProps {
  defaultTab?: "login" | "signup"
}

export function AuthForms({ defaultTab = "login" }: AuthFormsProps) {
  const router = useRouter()
  const { login, isLoading } = useAuth()
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const successLogin = await login(loginForm.email, loginForm.password)
    if (!successLogin) {
      setError("Invalid email or password")
    } else {
      router.push("/") // Redirect to home layout upon clean authorization token verification
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

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
          // Prefill the login form with the newly registered user attributes for ease of access
          setLoginForm({ email: signupForm.email, password: "" })
          setSignupForm({ email: "", password: "", name: "", institution: "" })
          setSuccess("")
          setActiveTab("login") // Switches user dynamically to login pane
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Image src="/ChemCurious_logo.svg" alt="ChemCurious Logo" width={44} height={44} />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">ChemCurious</CardTitle>
          <CardDescription>Sign in to track your progress and save your work</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
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
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
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
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}