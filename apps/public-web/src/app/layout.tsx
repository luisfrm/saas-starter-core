import "@repo/ui/globals.css"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata = {
  title: "Tienda",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
