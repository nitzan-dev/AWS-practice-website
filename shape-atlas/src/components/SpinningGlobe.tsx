import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import type { FeatureCollection, Geometry } from 'geojson'
import { useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useAtlas } from '../data/atlas'
import { loadWorld, worldKey, type WorldFeature } from '../data/world'

const SPEED = 9 // degrees per second
const TILT = -18
const HIGHLIGHT_EVERY = 2600 // ms
const graticule = geoGraticule10()

/** Slowly turning, draggable globe for the home screen; lights up a famous country as it passes. */
export function SpinningGlobe({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()
  const { countries } = useAtlas()

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let world: Map<string, WorldFeature> | null = null
    let land: FeatureCollection<Geometry> | null = null
    const famous = countries.filter((c) => c.tier === 1)

    let rotation: [number, number] = [-10, TILT]
    let velocity = SPEED
    let dragging = false
    let last = performance.now()
    let highlight: WorldFeature | undefined
    let highlightAt = 0
    let raf = 0
    let size = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = canvas.clientWidth
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    ro.observe(canvas)
    resize()

    // pick a famous country near the middle of the visible side
    const pickHighlight = () => {
      if (!world) return
      const center: [number, number] = [-rotation[0] + 25, -rotation[1]]
      const near = famous.filter((c) => geoDistance(c.centroid, center) < 0.75 && world!.has(worldKey(c)))
      const pick = near.length ? near[Math.floor(Math.random() * near.length)] : undefined
      highlight = pick ? world.get(worldKey(pick)) : undefined
    }

    function draw() {
      if (!size) return
      const r = size / 2 - 6
      const projection = geoOrthographic().scale(r).translate([size / 2, size / 2]).rotate(rotation).clipAngle(90)
      const path = geoPath(projection, ctx)
      ctx!.clearRect(0, 0, size, size)

      // atmosphere
      const atmo = ctx!.createRadialGradient(size / 2, size / 2, r * 0.9, size / 2, size / 2, r * 1.06)
      atmo.addColorStop(0, 'rgba(129,140,248,0)')
      atmo.addColorStop(0.5, 'rgba(129,140,248,0.35)')
      atmo.addColorStop(1, 'rgba(129,140,248,0)')
      ctx!.fillStyle = atmo
      ctx!.fillRect(0, 0, size, size)

      // ocean
      const ocean = ctx!.createRadialGradient(size * 0.38, size * 0.32, 0, size / 2, size / 2, r * 1.1)
      ocean.addColorStop(0, '#26338a')
      ocean.addColorStop(0.65, '#141c4a')
      ocean.addColorStop(1, '#0a0f2e')
      ctx!.beginPath()
      path({ type: 'Sphere' })
      ctx!.fillStyle = ocean
      ctx!.fill()

      ctx!.beginPath()
      path(graticule)
      ctx!.strokeStyle = 'rgba(129,140,248,0.13)'
      ctx!.lineWidth = 0.7
      ctx!.stroke()

      if (land) {
        ctx!.beginPath()
        path(land)
        ctx!.fillStyle = '#2f3c86'
        ctx!.fill()
        ctx!.strokeStyle = 'rgba(99,115,200,0.75)'
        ctx!.lineWidth = 0.5
        ctx!.stroke()
      }

      if (highlight) {
        const fade = Math.min(1, (performance.now() - highlightAt) / 500)
        const g = ctx!.createLinearGradient(size * 0.2, size * 0.2, size * 0.8, size * 0.8)
        g.addColorStop(0, '#22d3ee')
        g.addColorStop(0.55, '#818cf8')
        g.addColorStop(1, '#c084fc')
        ctx!.save()
        ctx!.globalAlpha = fade
        ctx!.shadowColor = 'rgba(129,140,248,0.9)'
        ctx!.shadowBlur = 14
        ctx!.beginPath()
        path(highlight)
        ctx!.fillStyle = g
        ctx!.fill()
        ctx!.restore()
      }

      // night-side shading
      const shade = ctx!.createRadialGradient(size * 0.35, size * 0.3, r * 0.4, size / 2, size / 2, r)
      shade.addColorStop(0, 'rgba(0,0,0,0)')
      shade.addColorStop(1, 'rgba(0,0,0,0.45)')
      ctx!.beginPath()
      path({ type: 'Sphere' })
      ctx!.fillStyle = shade
      ctx!.fill()
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!dragging) {
        // ease back to cruising speed after a fling
        velocity += (SPEED - velocity) * Math.min(1, dt * 1.5)
        rotation = [rotation[0] + velocity * dt, rotation[1] + (TILT - rotation[1]) * Math.min(1, dt)]
      }
      if (now - highlightAt > HIGHLIGHT_EVERY) {
        pickHighlight()
        highlightAt = now
      }
      draw()
      raf = requestAnimationFrame(tick)
    }

    loadWorld().then((w) => {
      world = w
      land = { type: 'FeatureCollection', features: [...w.values()] }
      pickHighlight()
      highlightAt = performance.now()
      draw()
      if (!reduce) raf = requestAnimationFrame(tick)
    })

    // drag to spin
    let px = 0
    let py = 0
    let pt = 0
    const down = (e: PointerEvent) => {
      dragging = true
      px = e.clientX
      py = e.clientY
      pt = performance.now()
      canvas.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const k = 180 / size
      const dx = (e.clientX - px) * k
      const dy = (e.clientY - py) * k
      const now = performance.now()
      velocity = (dx / Math.max(1, now - pt)) * 1000
      rotation = [rotation[0] + dx, Math.max(-60, Math.min(60, rotation[1] - dy))]
      px = e.clientX
      py = e.clientY
      pt = now
      if (reduce) draw()
    }
    const up = () => {
      dragging = false
      velocity = Math.max(-240, Math.min(240, velocity))
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [countries, reduce])

  return (
    <canvas
      ref={canvasRef}
      className={`aspect-square cursor-grab touch-none active:cursor-grabbing ${className}`}
      role="img"
      aria-label="Spinning globe"
    />
  )
}
