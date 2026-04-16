import { notFound } from "next/navigation"
import { readFile } from "fs/promises"
import path from "path"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Metadata } from "next"
import { ChevronLeft, Wrench } from "lucide-react"

type Props = {
  params: Promise<{ slug: string[] }>
}

async function getDocContent(slug: string[]): Promise<string | null> {
  const docsRoot = path.join(process.cwd(), "docs")
  const filePath = path.join(docsRoot, ...slug) + ".md"

  // Security: ensure we stay within the docs directory
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(docsRoot))) return null

  try {
    return await readFile(resolved, "utf-8")
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const content = await getDocContent(slug)
  if (!content) return { title: "Not Found" }
  const firstLine = content.split("\n").find((l) => l.startsWith("# "))
  const title = firstLine ? firstLine.replace(/^# /, "") : slug[slug.length - 1]
  return { title }
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params
  const content = await getDocContent(slug)
  if (!content) notFound()

  const backLabel = slug.length > 1 ? "Skills" : "Docs"

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border,oklch(0.88_0.008_70))] bg-[var(--surface,white)] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {backLabel}
          </Link>
          <span className="text-[var(--border-strong,oklch(0.78_0.010_68))]">/</span>
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-[var(--amber-500,oklch(0.70_0.19_62))]" />
            <span className="text-[13px] font-500 text-[var(--text-primary)]">
              {slug[slug.length - 1].replace(/_SKILL$/, "").replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <article className="prose-doc">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="font-[family-name:var(--font-display)] text-[28px] font-700 text-[var(--text-primary)] mb-2 mt-0 leading-tight">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="font-[family-name:var(--font-display)] text-[20px] font-600 text-[var(--text-primary)] mb-3 mt-10 pb-2 border-b border-[var(--border,oklch(0.88_0.008_70))] leading-snug">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="font-[family-name:var(--font-display)] text-[16px] font-600 text-[var(--text-primary)] mb-2 mt-6 leading-snug">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-[14px] font-600 text-[var(--text-primary)] mb-2 mt-4 uppercase tracking-wider">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="text-[15px] text-[var(--text-primary)] leading-relaxed mb-4">
                  {children}
                </p>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[var(--amber-400,oklch(0.76_0.17_64))] pl-4 my-4 text-[14px] text-[var(--text-secondary)] italic">
                  {children}
                </blockquote>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5 text-[15px] text-[var(--text-primary)]">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5 text-[15px] text-[var(--text-primary)]">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-")
                if (isBlock) {
                  return (
                    <code className="block font-[family-name:var(--font-mono)] text-[13px] leading-relaxed">
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[var(--workshop-100,oklch(0.95_0.006_75))] text-[var(--workshop-700,oklch(0.22_0.008_58))] px-1.5 py-0.5 rounded-sm">
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => (
                <pre className="bg-[var(--workshop-900,oklch(0.10_0.005_50))] text-[var(--workshop-100,oklch(0.95_0.006_75))] rounded-sm p-4 mb-4 overflow-x-auto text-[13px] leading-relaxed">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-[14px] border-collapse">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-[var(--workshop-100,oklch(0.95_0.006_75))]">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="text-left px-3 py-2.5 text-[12px] font-600 text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border,oklch(0.88_0.008_70))]">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2.5 border-b border-[var(--border,oklch(0.88_0.008_70))] text-[var(--text-primary)] align-top">
                  {children}
                </td>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-[var(--workshop-50,oklch(0.98_0.004_75))] transition-colors">
                  {children}
                </tr>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-[var(--amber-600,oklch(0.62_0.18_58))] hover:text-[var(--amber-700,oklch(0.52_0.16_55))] underline underline-offset-2"
                >
                  {children}
                </a>
              ),
              hr: () => (
                <hr className="border-none border-t border-[var(--border,oklch(0.88_0.008_70))] my-8" />
              ),
              strong: ({ children }) => (
                <strong className="font-600 text-[var(--text-primary)]">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-[var(--text-secondary)]">{children}</em>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  )
}
