"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface User {
  id: string
  email: string
  name: string
  institution: string
  role?: string
  status?: string
  createdAt?: string
}

export type LoginResult = { success: true; user: User } | { success: false; error: string }

interface AuthContextType {
  user: User | null
  error: string | null
  login: (email: string, password: string, portal?: "student" | "admin") => Promise<LoginResult>
  signup: (email: string, password: string, name: string, institution: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

function getSessionPortal(): string | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage.getItem("chem_active_portal") : null
  } catch {
    return null
  }
}

function setSessionPortal(val: string): void {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("chem_active_portal", val)
    }
  } catch {}
}

function removeSessionPortal(): void {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("chem_active_portal")
    }
  } catch {}
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session via HTTP cookie + tab-level sessionStorage
    const checkSession = async () => {
      try {
        const portal = getSessionPortal()

        if (portal === "admin") {
          // This tab was explicitly authenticated or active as Admin
          const response = await fetch("/api/admin/me")
          if (response.ok) {
            const data = await response.json()
            if (data && (data.role === "admin" || data.role === "staff")) {
              setUser({
                id: String(data.id),
                email: data.email,
                name: data.name,
                institution: data.institution || "",
                role: data.role,
                status: data.status,
              })
              setIsLoading(false)
              return
            }
          }
          removeSessionPortal()
        }

        // Student session check
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          if (data.user && data.user.role === "student") {
            // Only adopt student session if this tab isn't tagged as an active admin session
            if (portal !== "admin") {
              setUser(data.user)
              if (!getSessionPortal()) {
                setSessionPortal("student")
              }
            } else {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error("Session verification failed:", err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  const login = async (
    email: string,
    password: string,
    portal: "student" | "admin" = "student"
  ): Promise<LoginResult> => {
    setIsLoading(true)
    setError(null)
    try {
      const endpoint = portal === "admin" ? "/api/auth/admin-login" : "/api/auth/login"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const contentType = response.headers.get("content-type") ?? ""
      if (!response.ok) {
        const data = contentType.includes("application/json") ? await response.json() : null
        const errMsg = data?.error || `Sign in failed (HTTP ${response.status}). Please try again.`
        setError(errMsg)
        return {
          success: false,
          error: errMsg,
        }
      }

      if (!contentType.includes("application/json")) {
        const errMsg = "The sign-in service returned an unexpected response."
        setError(errMsg)
        return { success: false, error: errMsg }
      }

      const data = await response.json()
      const userObj: User = {
        id: String(data.id || data.user?.id || ""),
        email: data.email || data.user?.email || "",
        name: data.name || data.user?.name || "",
        institution: data.institution || data.user?.institution || "",
        role: data.role || data.user?.role || (portal === "admin" ? "admin" : "student"),
        status: data.status || data.user?.status,
        createdAt: data.createdAt || data.user?.createdAt,
      }
      setUser(userObj)
      setError(null)
      setSessionPortal(userObj.role === "admin" || userObj.role === "staff" ? "admin" : "student")
      return { success: true, user: userObj }
    } catch (err) {
      console.error("Login request failed:", err)
      const errMsg = "Unable to sign in. Please try again."
      setError(errMsg)
      return { success: false, error: errMsg }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
    institution: string
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, institution }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data)
        setSessionPortal("student")
        setIsLoading(false)
        return true
      } else {
        const errData = await response.json().catch(() => null)
        setError(errData?.error || "Registration failed")
      }
    } catch (err) {
      console.error("Signup request failed:", err)
      setError("Network error: Unable to connect to server")
    }

    setIsLoading(false)
    return false
  }

  const logout = async () => {
    setIsLoading(true)
    const activePortal = getSessionPortal()
    const isCurrentAdmin = activePortal === "admin" || user?.role === "admin" || user?.role === "staff"

    try {
      if (isCurrentAdmin) {
        await fetch("/api/auth/admin-logout", { method: "POST" })
      } else {
        await fetch("/api/auth/logout", { method: "POST" })
      }
    } catch (err) {
      console.error("Logout request failed:", err)
    }

    removeSessionPortal()
    setUser(null)
    setError(null)
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, error, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
