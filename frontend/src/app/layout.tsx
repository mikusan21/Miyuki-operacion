import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UTP+FOOD - Reserva tu menú",
  description: "Plataforma de reservas de menú universitario",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: avoid noisy hydration warnings when the
    // browser/extension mutates attributes on the <html> element before
    // React hydrates (e.g. Dark Reader). Prefer disabling such extensions
    // during development; this flag only silences the warning in React.
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.className} ${geistMono.className}`}>{children}</body>
    </html>
  )
}
