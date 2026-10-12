// 目次の並びと、セクションのキー ⇔ ページのスラッグの対応。ページは /<slug>。
// /derby は お客さん向けの公開ページなので、運営用のダービー案内（キー derby）は /derby-guide にする。
export const SECTION_ROUTES = [
  { key: 'overview', slug: 'overview' },
  { key: 'tickets', slug: 'tickets' },
  { key: 'schedule', slug: 'schedule' },
  { key: 'events', slug: 'events' },
  { key: 'derby', slug: 'derby-guide' },
  { key: 'derby-menu', slug: 'derby-menu' },
  { key: 'flow', slug: 'flow' },
  { key: 'prep', slug: 'prep' },
  { key: 'procure', slug: 'procurement' },
  { key: 'budget', slug: 'budget' },
  { key: 'revenue', slug: 'revenue' },
  { key: 'sales', slug: 'sales' },
  { key: 'menu', slug: 'menu' },
  { key: 'drinks', slug: 'drinks' },
  { key: 'roles', slug: 'roles' },
  { key: 'todo', slug: 'todo' },
  { key: 'review', slug: 'review' },
  { key: 'improve', slug: 'improve' },
] as const

export const keyOfSlug = (slug: string): string | undefined => SECTION_ROUTES.find((r) => r.slug === slug)?.key
export const slugOfKey = (key: string): string | undefined => SECTION_ROUTES.find((r) => r.key === key)?.slug
