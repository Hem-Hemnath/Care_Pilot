import { useState, useCallback, type DragEvent, type RefObject } from 'react'

export interface UseDragAndDropOptions {
  onFilesDropped: (files: FileList) => void
  acceptMimeTypes?: string[]
}

export function useDragAndDrop({ onFilesDropped }: UseDragAndDropOptions) {
  const [isDragging, setIsDragging] = useState(false)

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }, [isDragging])

  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Prevent flicker when hovering child elements inside dropzone
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      onFilesDropped(files)
    }
  }, [onFilesDropped])

  const triggerFileInput = useCallback((inputRef: RefObject<HTMLInputElement | null>) => {
    inputRef.current?.click()
  }, [])

  return {
    isDragging,
    dragProps: {
      onDragOver,
      onDragEnter,
      onDragLeave,
      onDrop,
    },
    triggerFileInput,
  }
}
