import { Geist } from "next/font/google";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// Root layout — minimal, no providers here.
// All providers live in app/[locale]/layout.tsx.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
