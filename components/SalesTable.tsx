import { computeSales, formatAmount } from '@/lib/sales'
import type { Section } from '@/lib/types'

const signed = (n: number | null, unit: string) => (n === null ? '' : `${n > 0 ? '+' : ''}${formatAmount(n, unit)}`)
const diffCls = (n: number | null) => (n === null ? 'text-mute' : n < 0 ? 'text-warn' : 'text-ok')

function Num({ v, empty = '—' }: { v: string; empty?: string }) {
  return v ? <span>{v}</span> : <span className="text-mute">{empty}</span>
}

// 試算・実績・差額（実績−試算）の表。広い画面は表、狭い画面はカード積み（横にはみ出さない）。
export default function SalesTable({ s }: { s: Extract<Section, { kind: 'table' }> }) {
  const { rows, total } = computeSales(s)
  if (rows.length === 0) return <p className="text-sm text-mute">{s.emptyText ?? '（まだありません）'}</p>
  return (
    <div className="space-y-2">
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm tabular">
          <thead>
            <tr className="border-b border-line text-left text-sub">
              <th className="px-2 py-1.5 font-semibold">項目</th>
              <th className="px-2 py-1.5 text-right font-semibold">試算</th>
              <th className="px-2 py-1.5 text-right font-semibold">実績</th>
              <th className="px-2 py-1.5 text-right font-semibold">差額</th>
              <th className="px-2 py-1.5 font-semibold">備考</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line/60 align-top">
                <td className="whitespace-pre-wrap px-2 py-1.5">{r.label}</td>
                <td className="px-2 py-1.5 text-right whitespace-nowrap"><Num v={formatAmount(r.est, r.unit)} /></td>
                <td className="px-2 py-1.5 text-right whitespace-nowrap"><Num v={formatAmount(r.act, r.unit)} empty="未入力" /></td>
                <td className={`px-2 py-1.5 text-right whitespace-nowrap ${diffCls(r.diff)}`}><Num v={signed(r.diff, r.unit)} /></td>
                <td className="whitespace-pre-wrap px-2 py-1.5 text-sub">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 sm:hidden">
        {rows.map((r, i) => (
          <li key={i} className="rounded-lg border border-line/70 p-2.5 text-sm">
            <div className="font-semibold">{r.label}</div>
            <dl className="mt-1 grid grid-cols-[3rem_1fr] gap-x-2 gap-y-0.5 tabular">
              <dt className="text-xs text-sub">試算</dt>
              <dd><Num v={formatAmount(r.est, r.unit)} /></dd>
              <dt className="text-xs text-sub">実績</dt>
              <dd><Num v={formatAmount(r.act, r.unit)} empty="未入力" /></dd>
              <dt className="text-xs text-sub">差額</dt>
              <dd className={diffCls(r.diff)}><Num v={signed(r.diff, r.unit)} /></dd>
            </dl>
            {r.note && <p className="mt-1 whitespace-pre-wrap text-xs text-sub">{r.note}</p>}
          </li>
        ))}
      </ul>
      {total && (
        <div className="rounded-lg bg-mute-soft p-2.5 text-sm font-bold tabular">
          <div className="mb-1 text-xs font-semibold text-sub">合計（単位が「円」の行）</div>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
            <span><span className="mr-1 text-xs text-sub">試算</span>{formatAmount(total.est, '円')}</span>
            <span><span className="mr-1 text-xs text-sub">実績</span>{total.act === null ? <span className="text-mute">未入力</span> : formatAmount(total.act, '円')}</span>
            <span className={diffCls(total.diff)}><span className="mr-1 text-xs text-sub">差額</span>{total.diff === null ? <span className="text-mute">—</span> : signed(total.diff, '円')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
