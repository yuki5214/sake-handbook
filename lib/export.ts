import { memoKey, readLocal, todoKey, type Status, type TodoLocal } from './local'
import type { Content } from './types'

const LABEL: Record<Status, string> = { '': '未設定', decided: '決定', hold: '保留', skip: '不要' }

// 端末内の全メモをテキスト化（共有本文は含めない）
export function exportMemos(content: Content): string {
  const out: string[] = []
  for (const s of content.sections) {
    const lines: string[] = []
    const memo = readLocal<string>(memoKey(s.key), '')
    if (memo.trim()) lines.push(memo.trim())
    if (s.kind === 'todo') {
      for (const it of s.items) {
        const l = readLocal<TodoLocal>(todoKey(it.id), { status: '', memo: '' })
        if (l.status || l.memo.trim()) {
          lines.push(`・${it.title}［${LABEL[l.status]}］${l.memo.trim() ? ' ' + l.memo.trim() : ''}`)
        }
      }
    }
    if (lines.length) out.push(`■${s.title}\n${lines.join('\n')}`)
  }
  return out.length ? out.join('\n\n') : '（メモはまだありません）'
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 非HTTPS等で失敗したときのフォールバック
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}
