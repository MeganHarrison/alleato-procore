import fs from "fs/promises"
import type { Dirent } from "fs"
import path from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  ChevronRight,
  FileText,
  FolderTree,
  Home,
  Search,
} from "lucide-react"
import { MarkdownRenderer } from "@/components/markdown-renderer"

type DocPageParams = {
  slug?: string[]
}

const DOCS_ROOT =
  process.env.DOCS_ROOT ||
  path.join(process.cwd(), "..", "..", "documentation", "docs")

interface DocPageProps {
  params: Promise<DocPageParams>
}

type NavItem = {
  title: string
  href: string
  children?: NavItem[]
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const filePath = resolvedParams.slug ? resolvedParams.slug.join("/") : "index"
  const title = resolvedParams.slug
    ? resolvedParams.slug[resolvedParams.slug.length - 1].replace(/-/g, " ")
    : "Documentation"

  return {
    title: `${title} | Documentation`,
    description: `View ${filePath} documentation`,
  }
}

export async function generateStaticParams() {
  const paths: { slug: string[] }[] = []

  async function walk(dir: string, basePath: string[] = []) {
    let entries: Dirent[] = []

    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      // If docs are missing, just return empty params so the app can still build
      return
    }

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(entryPath, [...basePath, entry.name])
      } else if (entry.name.endsWith(".md")) {
        paths.push({ slug: [...basePath, entry.name.replace(".md", "")] })
      }
    }
  }

  await walk(DOCS_ROOT)
  return paths
}

async function readFileOrNull(filePath: string) {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    return content
  } catch {
    return null
  }
}

async function listDir(dirPath: string) {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    const files: string[] = []
    const directories: string[] = []

    for (const item of items) {
      if (item.isDirectory()) {
        directories.push(item.name)
      } else if (item.name.endsWith(".md")) {
        files.push(item.name)
      }
    }

    return { files, directories }
  } catch {
    return { files: [], directories: [] }
  }
}

async function buildNav(
  dir: string,
  baseSegments: string[] = []
): Promise<NavItem[]> {
  let entries: Dirent[] = []
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const nav: NavItem[] = []
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const children = await buildNav(entryPath, [...baseSegments, entry.name])
      nav.push({
        title: entry.name.replace(/-/g, " "),
        href: `/docs/${[...baseSegments, entry.name].join("/")}`,
        children,
      })
    } else if (entry.name.endsWith(".md")) {
      const href = `/docs/${[...baseSegments, entry.name.replace(".md", "")].join("/")}`
      nav.push({
        title: entry.name.replace(".md", "").replace(/-/g, " "),
        href,
      })
    }
  }

  return nav.sort((a, b) => a.title.localeCompare(b.title))
}

function extractHeadings(markdown: string) {
  const regex = /^#{1,4}\s+(.*)$/gm
  const headings: { id: string; text: string; level: number }[] = []
  let match
  while ((match = regex.exec(markdown)) !== null) {
    const text = match[1].trim()
    const level = match[0].split("#").length - 1
    const id = text
      .toLowerCase()
      .replace(/[^\w]+/g, "-")
      .replace(/(^-|-$)/g, "")
    headings.push({ id, text, level })
  }
  return headings
}

function Breadcrumbs({ slug }: { slug?: string[] }) {
  const parts = slug || []

  return (
    <nav className="mb-4 flex items-center gap-1 text-sm text-slate-600">
      <Link href="/docs" className="flex items-center hover:text-slate-800">
        <Home className="h-4 w-4" />
        <span className="ml-1">Docs</span>
      </Link>

      {parts.map((part, index) => {
        const href = `/docs/${parts.slice(0, index + 1).join("/")}`
        const isLast = index === parts.length - 1
        const name = part.replace(/-/g, " ").replace(".md", "")

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{name}</span>
            ) : (
              <Link href={href} className="hover:text-slate-800">
                {name}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default async function DocPage({ params }: DocPageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug || []
  const requestPath = slug.join("/")
  const basePath = path.join(DOCS_ROOT, requestPath)
  const nav = await buildNav(DOCS_ROOT)

  let isDirectory = false
  let targetPath = basePath
  let targetContent = ""

  try {
    const stat = await fs.stat(basePath)
    isDirectory = stat.isDirectory()

    if (isDirectory) {
      const indexPath = path.join(basePath, "index.md")
      const indexContent = await readFileOrNull(indexPath)
      if (indexContent) {
        targetPath = indexPath
        isDirectory = false
        targetContent = indexContent
      }
    }
  } catch {
    const mdPath = `${basePath}.md`
    const mdContent = await readFileOrNull(mdPath)
    if (mdContent) {
      targetPath = mdPath
      targetContent = mdContent
    } else {
      notFound()
    }
  }

  if (isDirectory) {
    const { files, directories } = await listDir(basePath)
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Breadcrumbs slug={slug} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="flex items-center text-2xl font-semibold text-slate-900">
              <FolderTree className="mr-2 h-6 w-6 text-slate-500" />
              {slug.length > 0
                ? slug[slug.length - 1].replace(/-/g, " ")
                : "Documentation"}
            </h1>
            <p className="mt-2 text-slate-600">
              Browse documentation files and folders.
            </p>
          </div>

          {directories.length > 0 && (
            <div className="mb-6 space-y-3">
              <h2 className="text-lg font-medium text-slate-900">Folders</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {directories.map((dir) => (
                  <Link
                    key={dir}
                    href={`/docs/${requestPath}${requestPath ? "/" : ""}${dir}`}
                    className="flex items-center rounded-lg border border-slate-200 px-3 py-2 hover:border-slate-300 hover:bg-slate-50"
                  >
                    <FolderTree className="h-5 w-5 text-slate-500" />
                    <span className="ml-2 text-slate-800">
                      {dir.replace(/-/g, " ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-slate-900">Files</h2>
              <div className="space-y-2">
                {files.map((file) => (
                  <Link
                    key={file}
                    href={`/docs/${requestPath}${requestPath ? "/" : ""}${file.replace(".md", "")}`}
                    className="flex items-center rounded-lg border border-slate-200 px-3 py-2 hover:border-slate-300 hover:bg-slate-50"
                  >
                    <FileText className="h-5 w-5 text-slate-500" />
                    <span className="ml-2 text-slate-800">
                      {file.replace(".md", "").replace(/-/g, " ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const content = targetContent || (await readFileOrNull(targetPath)) || ""
  const headings = extractHeadings(content)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700"
            >
              DOCS
            </Link>
            <span className="text-sm font-semibold text-slate-900">
              Alleato Documentation
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="text-slate-400 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search documentation..."
                className="h-9 w-72 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-indigo-100"
              />
            </div>
            <Link
              href="/docs"
              className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100 md:flex"
            >
              Documentation
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8 md:px-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-96px)] w-64 shrink-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Navigation
          </h3>
          <nav className="space-y-4 text-sm">
            {nav.map((item) => (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  className={`block rounded-lg px-2 py-1.5 transition ${
                    requestPath && `/docs/${requestPath}` === item.href
                      ? "bg-indigo-50 font-semibold text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.title}
                </Link>
                {item.children && item.children.length > 0 && (
                  <div className="ml-2 border-l border-slate-200 pl-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block rounded-lg px-2 py-1 text-xs transition ${
                          requestPath && `/docs/${requestPath}` === child.href
                            ? "bg-indigo-50 font-semibold text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <div className="mb-6">
            <Breadcrumbs slug={slug} />
          </div>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <MarkdownRenderer content={content} />
          </article>
        </div>

        <aside className="sticky top-6 hidden h-[calc(100vh-96px)] w-52 shrink-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            On this page
          </h3>
          <nav className="space-y-1 text-sm">
            {headings.map((heading) => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className={`block rounded-md px-2 py-1 text-slate-700 transition hover:bg-slate-50 ${
                  heading.level === 1 ? "font-semibold" : "ml-2 text-xs"
                }`}
              >
                {heading.text}
              </a>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  )
}
