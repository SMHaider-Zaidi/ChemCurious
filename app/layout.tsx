import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { PwaRegister } from "@/components/pwa-register"

export const metadata: Metadata = {
  title: "ChemCurious — Interactive 3D Chemistry Platform",
  description:
    "ChemCurious — Interactive 3D Chemistry Platform & Simulation Engine. Explore chemistry through 3D molecular visualization, interactive periodic table, and chemical reaction modeling.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChemCurious",
  },
  icons: {
    icon: "/ChemCurious_logo.svg",
    apple: "/ChemCurious_logo.svg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Open+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body className="font-sans">
        <AuthProvider>
          <PwaRegister />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
