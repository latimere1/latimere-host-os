// lib/blog.ts
// Blog helpers for MD/MDX posts in content/blog.
//
// Used by:
// - pages/index.tsx        (landing: latest posts)
// - pages/blog/[slug].tsx  (full post page)
//
// Logging is controlled by NEXT_PUBLIC_DEBUG_BLOG or DEBUG_BLOG so you can
// quickly see what posts/paths are being resolved without noisy output.

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const BLOG_POSTS_DIR = path.join(process.cwd(), 'content', 'blog')

const debugBlog =
  process.env.NEXT_PUBLIC_DEBUG_BLOG === '1' || process.env.DEBUG_BLOG === '1'

export type BlogFrontMatter = {
  title: string
  date: string
  excerpt?: string
  tags?: string[]
  coverImage?: string
  slug?: string
  published?: boolean
}

export type BlogPost = {
  slug: string
  content: string
  frontMatter: BlogFrontMatter
}

// Simple internal logger
function log(...args: any[]) {
  if (debugBlog) {
    // eslint-disable-next-line no-console
    console.log('[blog]', ...args)
  }
}

// Get all filenames in content/blog that look like posts
function getPostFileNames(): string[] {
  try {
    const fileNames = fs.readdirSync(BLOG_POSTS_DIR)
    log('found files', fileNames)
    return fileNames.filter(
      (name) => name.endsWith('.md') || name.endsWith('.mdx')
    )
  } catch (err) {
    console.error('[blog] error reading blog directory', {
      dir: BLOG_POSTS_DIR,
      error: err,
    })
    return []
  }
}

// Public: return all posts as BlogPost[], sorted by date desc
export function getAllPosts(): BlogPost[] {
  const fileNames = getPostFileNames()

  const posts: BlogPost[] = fileNames
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, '')
      try {
        return getPostBySlug(slug)
      } catch (err) {
        console.error('[blog] failed to load post', { slug, error: err })
        return null
      }
    })
    .filter((p): p is BlogPost => Boolean(p))

  posts.sort((a, b) => {
    const aDate = new Date(a.frontMatter.date || 0).getTime()
    const bDate = new Date(b.frontMatter.date || 0).getTime()
    return bDate - aDate
  })

  log('getAllPosts resolved', posts.map((p) => p.slug))

  return posts
}

// Public: load one post by slug
export function getPostBySlug(slug: string): BlogPost {
  const realSlug = slug.replace(/\.mdx?$/, '')
  const filePathMd = path.join(BLOG_POSTS_DIR, `${realSlug}.md`)
  const filePathMdx = path.join(BLOG_POSTS_DIR, `${realSlug}.mdx`)

  let filePath: string | null = null
  if (fs.existsSync(filePathMdx)) {
    filePath = filePathMdx
  } else if (fs.existsSync(filePathMd)) {
    filePath = filePathMd
  }

  if (!filePath) {
    throw new Error(`Post not found for slug "${slug}" in ${BLOG_POSTS_DIR}`)
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)

  const frontMatter: BlogFrontMatter = {
    title: data.title || realSlug,
    date: data.date || new Date().toISOString(),
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    coverImage: data.coverImage || data.image || '',
    slug: realSlug,
    published: data.published !== false,
  }

  log('getPostBySlug', { slug: realSlug, filePath, frontMatter })

  return {
    slug: realSlug,
    content,
    frontMatter,
  }
}

// Public: convert markdown → HTML (used in getStaticProps for [slug].tsx)
export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await remark().use(html).process(markdown)
    const htmlString = result.toString()
    if (debugBlog) {
      log('markdownToHtml length', htmlString.length)
    }
    return htmlString
  } catch (err) {
    console.error('[blog] markdownToHtml error', err)
    return markdown
  }
}
