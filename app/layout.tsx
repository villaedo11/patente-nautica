import type { Metadata, Viewport } from "next"
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Condensed,
  IBM_Plex_Serif,
  IBM_Plex_Mono,
} from "next/font/google"
import "./globals.css"

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
})

const cond = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-plex-cond",
})

const serif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-plex-serif",
})

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-plex-mono",
})

export const metadata: Metadata = {
  title: "Patente nautica · entro 12 miglia",
  description:
    "Esercitazioni e simulazione d'esame sui 1472 quiz base del DD 131 del 31 maggio 2022.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Patente nautica", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8f1f4" },
    { media: "(prefers-color-scheme: dark)", color: "#081318" },
  ],
  // il quiz sta tutto in una schermata: niente zoom accidentale sui tap
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body
        className={`${sans.variable} ${cond.variable} ${serif.variable} ${mono.variable} min-h-dvh antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
