import { Geist_Mono, DM_Sans, Merriweather } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { OfflineDetector } from "@/components/offline-detector"
import { cn } from "@/lib/utils";
import { Metadata, Viewport } from "next";

const merriweatherHeading = Merriweather({subsets:['latin'],variable:'--font-heading'});

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: 'Phase',
  description: "A simple subscription tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Phase",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", dmSans.variable, merriweatherHeading.variable)}
    >
      <body>
        <ThemeProvider>
          <OfflineDetector />
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
