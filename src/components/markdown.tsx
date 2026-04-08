import ReactMarkdown from 'react-markdown'
import { useNavigate } from '@tanstack/react-router'

type MarkdownProps = {
  content: string
}

const Markdown = ({ content }: MarkdownProps) => {
  const navigate = useNavigate()

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Extract internal paths from full URLs or relative paths
    const internalPath = extractInternalPath(href)
    if (internalPath) {
      e.preventDefault()
      navigate({ to: internalPath })
    }
  }

  return (
    <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mb-1.5 prose-headings:mt-3 prose-h3:text-base prose-h2:text-base">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            const resolvedHref = href ?? ''
            const internalPath = extractInternalPath(resolvedHref)

            return (
              <a
                href={internalPath ?? resolvedHref}
                onClick={(e) => {
                  if (internalPath) {
                    handleLinkClick(e, resolvedHref)
                  }
                }}
                {...(!internalPath ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
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

const extractInternalPath = (href: string): string | null => {
  // Already a relative path
  if (href.startsWith('/recipes/') || href.startsWith('/admin/') || href.startsWith('/import')) {
    return href
  }

  // Full URL pointing to our app (AI sometimes generates these)
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

export { Markdown }
