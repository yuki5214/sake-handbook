export default function Toast({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4" role="status">
      <div className="rounded-full bg-ink px-4 py-2 text-sm text-bg shadow-lg">{text}</div>
    </div>
  )
}
