import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Archivo_Black, Bangers, Libre_Franklin } from 'next/font/google'
import './globals.css'

const display = Bangers({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
})

const black = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-black',
})

const body = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Earth-616 — MCU Timeline',
  description: 'Watch or rewatch the Marvel Cinematic Universe in official timeline order. Track what you have seen on this device.',
  applicationName: 'Earth-616',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#120e0c',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${display.variable} ${black.variable} ${body.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
