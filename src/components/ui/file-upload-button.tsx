'use client'

import { useRef, type ReactNode } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadButtonProps {
  /** Extensiones aceptadas, ej. ".p12,.pfx" o ".xlsx,.csv" */
  accept: string
  onFileSelected: (file: File) => void
  children?: ReactNode
  /** Tamaño máximo permitido en MB */
  maxSizeMB?: number
  onError?: (message: string) => void
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
  disabled?: boolean
}

const BYTES_PER_MB = 1_048_576
const DEFAULT_MAX_SIZE_MB = 10

/** Botón reutilizable de carga de archivos con validación de extensión y tamaño. */
export function FileUploadButton({
  accept,
  onFileSelected,
  children = 'Subir archivo',
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  onError,
  variant = 'outline',
  className,
  disabled,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const allowed = accept.split(',').map((ext) => ext.trim().toLowerCase())

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
    if (!allowed.includes(extension)) {
      onError?.(`Formato no permitido (${extension}). Use: ${accept}`)
      return
    }
    if (file.size > maxSizeMB * BYTES_PER_MB) {
      onError?.(`El archivo supera el tamaño máximo de ${maxSizeMB} MB.`)
      return
    }
    onFileSelected(file)
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} tabIndex={-1} />
      <Button
        type="button"
        size="sm"
        variant={variant}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={className ?? 'h-8 gap-1.5 text-xs'}
      >
        <Upload className="size-3.5" aria-hidden="true" />
        {children}
      </Button>
    </>
  )
}

