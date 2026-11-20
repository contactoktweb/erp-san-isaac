'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const PRINT_BODY_CLASS = 'corporate-print-active'
const FALLBACK_CLEAR_MS = 1200

export function useCorporatePrint() {
  const [printContent, setPrintContent] = useState<ReactNode>(null)
  const fallbackTimerRef = useRef<number | null>(null)

  const clearPrintState = useCallback(() => {
    document.body.classList.remove(PRINT_BODY_CLASS)
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    const handleAfterPrint = () => {
      clearPrintState()
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
      clearPrintState()
    }
  }, [clearPrintState])

  const triggerPrint = useCallback(
    (content: ReactNode) => {
      clearPrintState()
      setPrintContent(content)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.body.classList.add(PRINT_BODY_CLASS)
          window.print()
          fallbackTimerRef.current = window.setTimeout(clearPrintState, FALLBACK_CLEAR_MS)
        })
      })
    },
    [clearPrintState]
  )

  return { printContent, triggerPrint }
}

export function CorporatePrintPortal({ content }: { content: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || !content) return null

  return createPortal(
    <>
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 12mm;
          }
          body.${PRINT_BODY_CLASS} > *:not(#corporate-print-portal) {
            display: none !important;
          }
          body.${PRINT_BODY_CLASS} > #corporate-print-portal {
            display: block !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .corporate-print-page-break {
            break-before: page;
            page-break-before: always;
          }
        }
      `}</style>
      <div id="corporate-print-portal" className="hidden">
        {content}
      </div>
    </>,
    document.body
  )
}
