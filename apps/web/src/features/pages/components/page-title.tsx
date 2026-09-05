import { useEffect, useRef, useState } from 'react'
import * as m from '@/paraglide/messages'

interface PageTitleProps {
  title: string
  onChange: (title: string) => void
  readOnly: boolean
}

export function PageTitle({ title, onChange, readOnly }: PageTitleProps) {
  const [value, setValue] = useState(title)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (document.activeElement !== textareaRef.current) {
      setValue(title)
    }
  }, [title])

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      readOnly={readOnly}
      placeholder={m.page_untitled()}
      rows={1}
      onChange={(event) => {
        const next = event.target.value
        setValue(next)
        onChange(next)
      }}
      onBlur={() => {
        const trimmed = value.trim()
        if (trimmed !== value) {
          setValue(trimmed)
          onChange(trimmed)
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          textareaRef.current?.blur()
        }
      }}
      className="w-full resize-none overflow-hidden border-none bg-transparent text-4xl font-bold leading-tight tracking-tight outline-none placeholder:text-muted-foreground/40"
    />
  )
}
