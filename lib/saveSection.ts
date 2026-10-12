import 'server-only'
import { currentContent, mergeSection } from './mergeSection'
import { readRaw, writeIfUnchanged } from './store'
import type { Stored } from './store'

const MAX_TRIES = 5

export type SaveSectionResult = { ok: true; saved: Stored } | { ok: false; status: 400 | 404 | 409 | 503; error: string }

/**
 * セクション単位の保存。最新の本文を読み、そのセクションだけを差し替えて、読んだ値のままのときだけ書く（原子的）。
 * 書く直前に他の人の保存が入っていたら、読み直して（編集前のセクションと比べ直して）やり直す。
 * 別のセクションが変わっただけなら、そのまま続けて保存できる。同じセクションが変わっていたら 409。
 */
export async function saveSection(key: string, section: unknown, base: unknown, by: string | null): Promise<SaveSectionResult> {
  for (let i = 0; i < MAX_TRIES; i++) {
    const { raw, stored } = await readRaw()
    const merged = mergeSection(currentContent(stored?.content), key, section, base)
    if (!merged.ok) return merged
    const saved = await writeIfUnchanged(raw, merged.content, by)
    if (saved) return { ok: true, saved }
  }
  return { ok: false, status: 503, error: '他の保存と重なり続けたため、保存できませんでした。もう一度お試しください' }
}
