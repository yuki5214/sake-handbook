'use client'

import { useCallback, useEffect, useState } from 'react'

const PASS_KEY = 'sakehb:owner-pass'

/** オーナー（パスコード）の認証状態。パスコードはこの端末のタブ内（sessionStorage）にだけ持つ。 */
export function useOwner() {
  const [pass, setPassState] = useState<string | null>(null)

  useEffect(() => {
    try {
      // 前回ログインしたパスコードを引き継ぐ（この端末のみ）
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPassState(sessionStorage.getItem(PASS_KEY))
    } catch {}
  }, [])

  const setPass = useCallback((p: string | null) => {
    try {
      if (p === null) sessionStorage.removeItem(PASS_KEY)
      else sessionStorage.setItem(PASS_KEY, p)
    } catch {}
    setPassState(p)
  }, [])

  return { pass, setPass }
}
