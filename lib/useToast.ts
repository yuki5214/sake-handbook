'use client'

import { useCallback, useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState('')
  const flash = useCallback((m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2500)
  }, [])
  return { toast, flash }
}
