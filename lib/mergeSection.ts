import { migrate } from './migrate'
import { SEED } from './seed'
import { isContent, isSection } from './types'
import type { Content, Section } from './types'

export type MergeResult =
  | { ok: true; content: Content }
  | { ok: false; status: 400 | 404 | 409; error: string }

// 保存済みの本文（無ければ初期本文）に読み込み時補正をかけた「いまの本文」。クライアントが見ているものと同じ形になる。
export const currentContent = (stored: Content | null | undefined): Content => migrate(structuredClone(stored ?? SEED))

/**
 * 1セクションだけを差し替えた本文を作る（他のセクションは今の本文のまま）。
 * base＝編集を始めたときのそのセクション。今のセクションと違えば、別の人が先に変更したので 409（上書きしない）。
 */
export function mergeSection(cur: Content, key: string, section: unknown, base: unknown): MergeResult {
  if (!isSection(section) || section.key !== key) return { ok: false, status: 400, error: 'セクションの形式が不正です' }
  if (!isSection(base) || base.key !== key) return { ok: false, status: 400, error: '編集前のセクションの指定が不正です' }
  const i = cur.sections.findIndex((s) => s.key === key)
  if (i === -1) return { ok: false, status: 404, error: 'このセクションは見つかりません' }
  if (JSON.stringify(cur.sections[i]) !== JSON.stringify(base)) {
    return { ok: false, status: 409, error: '編集を始めたあとに、他の人がこのセクションを更新しました。保存していません' }
  }
  const sections: Section[] = cur.sections.map((s, k) => (k === i ? section : s))
  const content: Content = { ...cur, sections }
  return isContent(content) ? { ok: true, content } : { ok: false, status: 400, error: '本文の形式が不正です' }
}
