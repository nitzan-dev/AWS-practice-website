// Only URLs are bundled; each flag SVG is fetched when first shown.
const FLAGS = import.meta.glob('/node_modules/flag-icons/flags/4x3/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

const urlFor = (iso2: string) => FLAGS[`/node_modules/flag-icons/flags/4x3/${iso2}.svg`]

export function Flag({ iso2, className = '' }: { iso2: string; className?: string }) {
  const src = urlFor(iso2)
  if (!src) return null
  return <img src={src} alt="" width={72} height={54} className={`aspect-[4/3] object-cover ${className}`} />
}
