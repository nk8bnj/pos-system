import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'POS Система',
  description: 'Система управління продажами',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${geist.variable} antialiased bg-gray-50 text-gray-900`}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 bg-slate-50">{children}</main>
        </div>
      </body>
    </html>
  )
}
