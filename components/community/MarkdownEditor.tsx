// components/community/MarkdownEditor.tsx
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownEditorProps = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minRows?: number
  maxRows?: number
  label?: string
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write in Markdown…',
  minRows = 8,
  maxRows = 24,
  label = 'Details (Markdown supported)',
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  // ----------- auto-resize -----------
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    // Reset → grow to content, capped by maxRows
    el.style.height = 'auto'
    const lineHeight = getLineHeight(el) ?? 22 // px fallback
    const maxPx = maxRows * lineHeight
    el.style.height = Math.min(el.scrollHeight, maxPx) + 'px'
  }, [value, maxRows])

  // ----------- mount log -----------
  useEffect(() => {
    console.log('🧰 MarkdownEditor mounted', { label, length: value?.length ?? 0 })
  }, [label])

  const charCount = value.length
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  // ----------- toolbar helpers -----------
  function insertSnippet(before = '', after = '') {
    const el = taRef.current
    if (!el) return
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const selected = value.slice(start, end)
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    queueMicrotask(() => {
      // keep selection around inserted snippet
      const pos = start + before.length + selected.length + after.length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  function onBold() {
    console.log('🖊️ toolbar: bold')
    insertSnippet('**', '**')
  }
  function onItalic() {
    console.log('🖊️ toolbar: italic')
    insertSnippet('_', '_')
  }
  function onCode() {
    console.log('🖊️ toolbar: code')
    insertSnippet('`', '`')
  }
  function onLink() {
    console.log('🖊️ toolbar: link')
    const el = taRef.current
    const start = el?.selectionStart ?? 0
    const end = el?.selectionEnd ?? 0
    const selected = value.slice(start, end) || 'link text'
    const url = 'https://'
    const md = `[${selected}](${url})`
    insertSnippet('', '') // will set focus/selection; now replace properly
    const next = value.slice(0, start) + md + value.slice(end)
    onChange(next)
    queueMicrotask(() => {
      if (!el) return
      // select the URL so it's easy to overwrite
      const urlStart = start + md.indexOf(url)
      const urlEnd = urlStart + url.length
      el.focus()
      el.setSelectionRange(urlStart, urlEnd)
    })
  }
  function onList() {
    console.log('🖊️ toolbar: list')
    const el = taRef.current
    if (!el) return
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    const selected = value.slice(start, end) || 'item one\nitem two\nitem three'
    const lines = selected.replace(/\r/g, '').split('\n')
    const bullet = lines.map((l) => (l ? `- ${l}` : '- ')).join('\n')
    const next = value.slice(0, start) + bullet + value.slice(end)
    onChange(next)
    queueMicrotask(() => {
      const pos = start + bullet.length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  // ----------- textarea key handling (Tab indent / Shift+Tab outdent) -----------
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Tab') return
    const el = e.currentTarget
    const start = el.selectionStart
    const end = el.selectionEnd
    const hasSelection = start !== end
    e.preventDefault()

    if (!hasSelection) {
      // insert two spaces where the caret is
      const next = value.slice(0, start) + '  ' + value.slice(end)
      onChange(next)
      queueMicrotask(() => {
        el.setSelectionRange(start + 2, start + 2)
      })
      return
    }

    const before = value.slice(0, start)
    const selected = value.slice(start, end)
    const after = value.slice(end)

    if (e.shiftKey) {
      // outdent
      const out = selected
        .split('\n')
        .map((ln) => (ln.startsWith('  ') ? ln.slice(2) : ln.replace(/^\t/, '')))
        .join('\n')
      const next = before + out + after
      onChange(next)
      queueMicrotask(() => {
        el.setSelectionRange(start, start + out.length)
      })
    } else {
      // indent
      const ind = selected
        .split('\n')
        .map((ln) => `  ${ln}`)
        .join('\n')
      const next = before + ind + after
      onChange(next)
      queueMicrotask(() => {
        el.setSelectionRange(start, start + ind.length)
      })
    }
  }

  return (
    <div className="w-full">
      {/* Label / toolbar */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">
          {label}{' '}
          <span className="text-xs text-slate-500 ml-1">(supports **bold**, _italic_, lists, code, links)</span>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={onBold} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">
            **B**
          </button>
          <button type="button" onClick={onItalic} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">
            _i_
          </button>
          <button type="button" onClick={onCode} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">
            `code`
          </button>
          <button type="button" onClick={onLink} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">
            link
          </button>
          <button type="button" onClick={onList} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">
            • list
          </button>

          <div className="ml-2 rounded bg-slate-100 p-1">
            <button
              type="button"
              className={`px-3 py-0.5 text-xs rounded ${tab === 'edit' ? 'bg-white shadow' : ''}`}
              onClick={() => {
                setTab('edit')
                console.log('🔄 Markdown tab → edit')
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className={`ml-1 px-3 py-0.5 text-xs rounded ${tab === 'preview' ? 'bg-white shadow' : ''}`}
              onClick={() => {
                setTab('preview')
                console.log('🔄 Markdown tab → preview')
              }}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Editor / Preview */}
      {tab === 'edit' ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={minRows}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-300 p-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
        />
      ) : (
        <div className="border border-slate-300 rounded-xl p-3 bg-white prose max-w-none prose-slate">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value || '_Nothing to preview yet…_'}
          </ReactMarkdown>
        </div>
      )}

      {/* Footer / counters */}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <div>{wordCount} words</div>
        <div>{charCount}/5000</div>
      </div>
    </div>
  )
}

/* -------------------- utils -------------------- */
function getLineHeight(el: HTMLElement): number | null {
  try {
    const lh = window.getComputedStyle(el).lineHeight
    if (!lh) return null
    if (lh.endsWith('px')) return parseFloat(lh)
    // if "normal", approximate
    const fs = parseFloat(window.getComputedStyle(el).fontSize || '14')
    return Math.round(fs * 1.4)
  } catch {
    return null
  }
}
