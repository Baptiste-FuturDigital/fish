import { useEffect, useRef } from "react"

const MIN_PIXEL_RESOLUTION = 12
const PIXELATION_DURATION_MS = 10_000

export function pixelResolutionAtProgress(progress: number, maxResolution: number) {
  const boundedProgress = Math.min(1, Math.max(0, progress))
  if (boundedProgress === 1) return maxResolution
  return Math.round(
    MIN_PIXEL_RESOLUTION
      * Math.pow(maxResolution / MIN_PIXEL_RESOLUTION, boundedProgress),
  )
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
}

export function TotemPixelation({ imageUrl }: { imageUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    const buffer = document.createElement("canvas")
    const bufferContext = buffer.getContext("2d")
    if (!bufferContext) return

    const image = new Image()
    let animationFrame = 0
    let lastResolution = 0

    image.onload = () => {
      const bounds = canvas.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(320, Math.round(bounds.width * pixelRatio))
      canvas.height = Math.max(240, Math.round(bounds.height * pixelRatio))
      const startedAt = performance.now()

      const drawFrame = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / PIXELATION_DURATION_MS)
        const resolution = pixelResolutionAtProgress(progress, canvas.width)

        if (resolution !== lastResolution || progress === 1) {
          lastResolution = resolution
          buffer.width = resolution
          buffer.height = Math.max(1, Math.round(resolution * canvas.height / canvas.width))
          bufferContext.imageSmoothingEnabled = true
          drawCover(bufferContext, image, buffer.width, buffer.height)

          context.clearRect(0, 0, canvas.width, canvas.height)
          context.imageSmoothingEnabled = false
          context.drawImage(buffer, 0, 0, canvas.width, canvas.height)
          canvas.dataset.pixelResolution = String(resolution)
          canvas.style.filter = `blur(${Math.max(0, 18 * (1 - progress)).toFixed(2)}px) brightness(${(0.4 + progress * 0.6).toFixed(2)}) saturate(${(0.3 + progress * 0.7).toFixed(2)})`
        }

        if (progress < 1) animationFrame = window.requestAnimationFrame(drawFrame)
      }

      animationFrame = window.requestAnimationFrame(drawFrame)
    }
    image.src = imageUrl

    return () => {
      image.onload = null
      window.cancelAnimationFrame(animationFrame)
    }
  }, [imageUrl])

  return (
    <canvas
      ref={canvasRef}
      className="totem-pixelation"
      data-testid="totem-pixelation"
      data-image-src={imageUrl}
      aria-hidden="true"
    />
  )
}
