// lib/blog.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import slugify from 'slugify'

export type BlogPost = {
  slug: string
  title: string
  date: string
  author?: string
  excerpt?: string
  coverImage?: string
  content?: string
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

function toSlug(raw: string) {
  return slugify(raw, { lower: true, strict: true })
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))

  // Read, parse, and generate slugs
  const parsed = files.map((file) => {
    const fullPath = path.join(BLOG_DIR, file)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(raw)

    const title = (data.title as string) || file.replace(/\.mdx?$/, '')
    const slug = (data.slug as string) || toSlug(title)

    // lightweight excerpt if not provided
    const excerpt =
      (data.excerpt as string) ||
      content.trim().split('\n').find(Boolean)?.slice(0, 180)?.concat('…')

    return {
      slug,
      title,
      date: (data.date as string) || new Date().toISOString().slice(0, 10),
      author: (data.author as string) || 'Latimere Team',
      coverImage: (data.coverImage as string) || '/images/cabin-exterior-01.jpg',
      excerpt,
      // content omitted for index
    } as BlogPost
  })

  // De-dupe by slug (first one wins; logs a warning once)
  const seen = new Set<string>()
  const unique: BlogPost[] = []
  for (const p of parsed) {
    if (seen.has(p.slug)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[blog] duplicate slug ignored → ${p.slug}`)
      }
      continue
    }
    seen.add(p.slug)
    unique.push(p)
  }

  // newest first
  unique.sort((a, b) => (a.date < b.date ? 1 : -1))
  return unique
}

export function getPostBySlug(slug: string): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) return null

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))

  for (const file of files) {
    const fullPath = path.join(BLOG_DIR, file)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(raw)

    const title = (data.title as string) || file.replace(/\.mdx?$/, '')
    const fileSlug = (data.slug as string) || toSlug(title)
    if (fileSlug !== slug) continue

    return {
      slug: fileSlug,
      title,
      date: (data.date as string) || new Date().toISOString().slice(0, 10),
      author: (data.author as string) || 'Latimere Team',
      coverImage: (data.coverImage as string) || '/images/cabin-exterior-01.jpg',
      excerpt: (data.excerpt as string) || '',
      content, // raw; we’ll HTML it below
    }
  }
  return null
}

export async function markdownToHtml(md: string) {
  const result = await remark().use(html).process(md)
  return result.toString()
}
