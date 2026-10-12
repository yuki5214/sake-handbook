import { notFound } from 'next/navigation'
import SectionPage from '@/components/SectionPage'
import { keyOfSlug, SECTION_ROUTES } from '@/lib/routes'

// 目次にあるページだけ（未知のスラッグは 404）。/derby（お客さん向け）は別ページで、ここには来ない。
export const dynamicParams = false

export function generateStaticParams() {
  return SECTION_ROUTES.map((r) => ({ slug: r.slug }))
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const key = keyOfSlug(slug)
  if (!key) notFound()
  return <SectionPage sectionKey={key} />
}
