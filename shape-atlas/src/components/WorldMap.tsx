import { select } from 'd3-selection'
import 'd3-transition'
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom'
import { Maximize2, Minus, Plus } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapCountry, WorldMapData } from '../data/types'

type Box = [number, number, number, number]

interface Props {
  data: WorldMapData
  /** Changes every question; resets the view. */
  questionKey: number
  selectedId: string | null
  onSelect: (id: string) => void
  revealed: boolean
  targetId: string
  pickedId: string | null
  /** Countries to tint (neighbours hint). */
  highlightIds?: string[]
  /** Countries to zoom to (continent hint). */
  focusIds?: string[]
  hideBorders?: boolean
}

const MAX_ZOOM = 40

function union(boxes: Box[]): Box {
  return [
    Math.min(...boxes.map((b) => b[0])),
    Math.min(...boxes.map((b) => b[1])),
    Math.max(...boxes.map((b) => b[2])),
    Math.max(...boxes.map((b) => b[3])),
  ]
}

type Paint = 'idle' | 'selected' | 'highlight' | 'correct' | 'wrong' | 'dim'

const FILL: Record<Paint, string> = {
  idle: '#33418f',
  highlight: '#4f5fc4',
  selected: '#f97316',
  correct: '#34d399',
  wrong: '#f87171',
  dim: '#26306d',
}

interface PathsProps {
  countries: MapCountry[]
  paint: (id: string) => Paint
  hideBorders: boolean
  hoverable: boolean
}

// Memoised so zooming (which re-renders the dots) doesn't touch ~200 heavy paths.
const CountryPaths = memo(function CountryPaths({ countries, paint, hideBorders, hoverable }: PathsProps) {
  return (
    <g>
      {countries.map((c) => {
        const p = paint(c.id)
        return (
          <path
            key={c.id}
            d={c.d}
            data-id={c.id}
            fill={FILL[p]}
            stroke={hideBorders && p !== 'selected' ? FILL[p] : '#0b1033'}
            strokeWidth={hideBorders ? 0.8 : 0.7}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={`transition-[fill] duration-200 ${hoverable && p === 'idle' ? 'cursor-pointer hover:fill-[#4a5bc0]' : hoverable ? 'cursor-pointer' : ''}`}
          />
        )
      })}
    </g>
  )
})

export function WorldMap({
  data,
  questionKey,
  selectedId,
  onSelect,
  revealed,
  targetId,
  pickedId,
  highlightIds,
  focusIds,
  hideBorders = false,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [k, setK] = useState(1)
  const reduce = useReducedMotion()
  const [vx, vy, vw, vh] = data.viewBox
  const byId = useMemo(() => new Map(data.countries.map((c) => [c.id, c])), [data])

  // The part of the map actually on screen, in map units. Wide boxes show the whole world;
  // narrow (phone) boxes fill their height and show a slice you can pan across.
  const [vis, setVis] = useState<Box>([vx, vy, vx + vw, vy + vh])
  const slice = vis[2] - vis[0] < vw - 1
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (!width || !height) return
      if (width / height >= vw / vh) return setVis([vx, vy, vx + vw, vy + vh])
      const visW = (vh * width) / height
      const x0 = vx + (vw - visW) / 2
      setVis([x0, vy, x0 + visW, vy + vh])
    })
    ro.observe(svgRef.current!)
    return () => ro.disconnect()
  }, [vx, vy, vw, vh])

  useEffect(() => {
    const svg = select(svgRef.current!)
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [vx, vy],
        [vx + vw, vy + vh],
      ])
      .clickDistance(5)
      .on('zoom', (e) => {
        gRef.current?.setAttribute('transform', e.transform.toString())
        setK(e.transform.k)
      })
    svg.call(z).on('dblclick.zoom', null)
    zoomRef.current = z
    return () => {
      svg.on('.zoom', null)
    }
  }, [vx, vy, vw, vh])

  useEffect(() => {
    zoomRef.current?.extent([
      [vis[0], vis[1]],
      [vis[2], vis[3]],
    ])
  }, [vis])

  const zoomToBox = useCallback(
    (b: Box, maxK: number) => {
      const z = zoomRef.current
      if (!z) return
      const w = Math.max(b[2] - b[0], 1)
      const h = Math.max(b[3] - b[1], 1)
      const scale = Math.max(1, Math.min(maxK, 0.8 / Math.max(w / (vis[2] - vis[0]), h / (vis[3] - vis[1]))))
      const t = zoomIdentity
        .translate((vis[0] + vis[2]) / 2, (vis[1] + vis[3]) / 2)
        .scale(scale)
        .translate(-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2)
      select(svgRef.current!).transition().duration(reduce ? 0 : 900).call(z.transform, t)
    },
    [vis, reduce],
  )

  const zoomBy = (factor: number) => {
    if (zoomRef.current) select(svgRef.current!).transition().duration(250).call(zoomRef.current.scaleBy, factor)
  }
  const resetView = useCallback(() => {
    if (zoomRef.current) select(svgRef.current!).transition().duration(reduce ? 0 : 600).call(zoomRef.current.transform, zoomIdentity)
  }, [reduce])

  // new question: back to the whole world
  useEffect(() => {
    resetView()
  }, [questionKey, resetView])

  // continent hint: zoom to that region
  const focusKey = focusIds?.join(',')
  useEffect(() => {
    if (!focusIds?.length || revealed) return
    const boxes = focusIds.map((id) => byId.get(id)?.b).filter((b): b is Box => !!b)
    if (boxes.length) zoomToBox(union(boxes), 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey])

  // reveal: fly to the answer (and the wrong pick, if it's nearby)
  useEffect(() => {
    if (!revealed) return
    const target = byId.get(targetId)
    if (!target) return
    const picked = pickedId && pickedId !== targetId ? byId.get(pickedId) : undefined
    const both = picked ? union([target.b, picked.b]) : target.b
    zoomToBox(both[2] - both[0] < (vis[2] - vis[0]) * 0.45 ? both : target.b, target.dot ? 14 : 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, targetId, pickedId, byId])

  const highlight = useMemo(() => new Set(highlightIds), [highlightIds])
  const paint = useCallback(
    (id: string): Paint => {
      if (revealed) {
        if (id === targetId) return 'correct'
        if (id === pickedId) return 'wrong'
        return 'dim'
      }
      if (id === selectedId) return 'selected'
      if (highlight.has(id)) return 'highlight'
      return 'idle'
    },
    [revealed, targetId, pickedId, selectedId, highlight],
  )

  const dots = data.countries.filter((c) => c.dot)
  const target = byId.get(targetId)

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={data.viewBox.join(' ')}
        preserveAspectRatio={slice ? 'xMidYMid slice' : 'xMidYMid meet'}
        className="block h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        role="application"
        aria-label="World map. Drag to pan, scroll or pinch to zoom, click a country to select it."
        onClick={(e) => {
          if (revealed) return
          const id = (e.target as Element).getAttribute('data-id')
          if (id) onSelect(id)
        }}
      >
        <defs>
          <radialGradient id="map-ocean" cx="50%" cy="45%" r="70%">
            <stop offset="0" stopColor="#17205a" />
            <stop offset="1" stopColor="#0b1033" />
          </radialGradient>
        </defs>
        <g ref={gRef}>
          <path d={data.sphere} fill="url(#map-ocean)" stroke="#2b3670" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <path d={data.graticule} fill="none" stroke="#818cf8" strokeOpacity={0.1} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          <path d={data.other} fill="#1f2860" stroke="#0b1033" strokeWidth={0.5} vectorEffect="non-scaling-stroke" pointerEvents="none" />
          <CountryPaths countries={data.countries} paint={paint} hideBorders={hideBorders} hoverable={!revealed && !hideBorders} />

          {/* tiny countries: a visible dot plus a generous invisible hit area */}
          {dots.map((c) => {
            const p = paint(c.id)
            return (
              <g key={c.id} transform={`translate(${c.c[0]} ${c.c[1]})`}>
                <circle
                  r={4.5 / k}
                  fill={p === 'idle' ? 'none' : FILL[p]}
                  stroke={p === 'idle' || p === 'dim' ? '#a5b4fc' : '#fff'}
                  strokeOpacity={p === 'dim' ? 0.3 : 0.75}
                  strokeWidth={1.2}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
                <circle r={11 / k} data-id={c.id} fill="transparent" className={revealed ? '' : 'cursor-pointer'} />
              </g>
            )
          })}

          {revealed && target && (
            <g transform={`translate(${target.c[0]} ${target.c[1]})`} pointerEvents="none">
              <circle r={16 / k} fill="none" stroke="#34d399" strokeWidth={2.5} vectorEffect="non-scaling-stroke">
                {!reduce && (
                  <>
                    <animate attributeName="r" values={`${8 / k};${26 / k};${8 / k}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
                  </>
                )}
              </circle>
            </g>
          )}
        </g>
      </svg>

      <div className="absolute bottom-2 right-2 flex gap-1.5 sm:bottom-3 sm:right-3 sm:flex-col sm:gap-2">
        {[
          { label: 'Zoom in', icon: <Plus size={18} />, run: () => zoomBy(1.8) },
          { label: 'Zoom out', icon: <Minus size={18} />, run: () => zoomBy(1 / 1.8) },
          { label: 'Show whole world', icon: <Maximize2 size={16} />, run: resetView },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            title={b.label}
            onClick={b.run}
            className="focus-ring clay flex size-11 cursor-pointer items-center justify-center text-muted transition-[filter] duration-200 hover:text-ink hover:brightness-125"
          >
            {b.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
