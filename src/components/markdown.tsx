import ReactMarkdown from 'react-markdown'
import { Link } from '@tanstack/react-router'

type MarkdownProps = {
  content: string
}

const extractInternalPath = (href: string): string | null => {
  if (href.startsWith('/recipes/') || href.startsWith('/admin/') || href.startsWith('/import')) {
    return href
  }

  try {
    const url = new URL(href)
    if (url.pathname.startsWith('/recipes/')) {
      return url.pathname
    }
  } catch {
    // Not a valid URL, ignore
  }

  return null
}

const Markdown = ({ content }: MarkdownProps) => {
  return (
    <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mb-1.5 prose-headings:mt-3 prose-h3:text-base prose-h2:text-base">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            const resolvedHref = href ?? ''
            const internalPath = extractInternalPath(resolvedHref)

            if (internalPath) {
              return <Link to={internalPath} className="text-blue-600 underline hover:text-blue-800">{children}</Link>
            }

            return (
              <a href={resolvedHref} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export { Markdown }
