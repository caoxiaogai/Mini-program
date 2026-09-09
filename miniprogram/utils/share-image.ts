import { prepareMediaUrl } from './media'

/** 微信分享卡片显示比例为 5:4，先按此尺寸出图并铺满图片区，避免平台再裁切或两侧留白。 */
export const SHARE_CARD_WIDTH = 500
export const SHARE_CARD_HEIGHT = 400
export const SHARE_CARD_BACKGROUND = '#DEE2E7'

const shareImageCache = new Map<string, Promise<string>>()

type ShareCanvasContext = {
  fillStyle: string
  fillRect(x: number, y: number, width: number, height: number): void
  save(): void
  restore(): void
  beginPath(): void
  rect(x: number, y: number, width: number, height: number): void
  clip(): void
  drawImage(image: WechatMiniprogram.Image, dx: number, dy: number, dw: number, dh: number): void
}

type OffscreenCanvas2D = {
  width: number
  height: number
  getContext(contextType: '2d'): ShareCanvasContext | null
  createImage(): WechatMiniprogram.Image
}

export function coverDestRect(
  sourceWidth: number,
  sourceHeight: number,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
): { dx: number; dy: number; dw: number; dh: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) {
    return { dx: boxX, dy: boxY, dw: 0, dh: 0 }
  }

  const scale = Math.max(boxWidth / sourceWidth, boxHeight / sourceHeight)
  const dw = sourceWidth * scale
  const dh = sourceHeight * scale
  return {
    dx: boxX + (boxWidth - dw) / 2,
    dy: boxY + (boxHeight - dh) / 2,
    dw,
    dh,
  }
}

/** 生成好友/朋友圈分享图：按 5:4 居中铺满裁切，不在图片区留白。 */
export function prepareShareCardImage(url: string | undefined | null): Promise<string> {
  const source = (url ?? '').trim()
  if (!source) return Promise.resolve('')

  const cached = shareImageCache.get(source)
  if (cached) return cached

  const pending = cropShareCardImage(source).catch(() => source)
  shareImageCache.set(source, pending)
  return pending
}

async function cropShareCardImage(source: string): Promise<string> {
  const localUrl = await prepareMediaUrl(source)
  if (!localUrl) return source

  const info = await probeImage(localUrl)
  const canvas = createShareCanvas(SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('share canvas unavailable')

  ctx.fillStyle = SHARE_CARD_BACKGROUND
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)

  const image = await loadCanvasImage(canvas, info.path)
  const draw = coverDestRect(info.width, info.height, 0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)
  ctx.clip()
  ctx.drawImage(image, draw.dx, draw.dy, draw.dw, draw.dh)
  ctx.restore()

  return exportCanvasImage(canvas)
}

function probeImage(src: string): Promise<{ width: number; height: number; path: string }> {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: (res) => {
        if (res.width <= 0 || res.height <= 0) {
          reject(new Error('share image size invalid'))
          return
        }
        resolve({
          width: res.width,
          height: res.height,
          path: res.path || src,
        })
      },
      fail: () => reject(new Error('share image probe failed')),
    })
  })
}

function createShareCanvas(width: number, height: number): OffscreenCanvas2D {
  const create = wx.createOffscreenCanvas as unknown as (options: {
    type: '2d'
    width: number
    height: number
  }) => OffscreenCanvas2D
  const canvas = create({ type: '2d', width, height })
  canvas.width = width
  canvas.height = height
  if (typeof canvas.createImage !== 'function') {
    throw new Error('share canvas image loader unavailable')
  }
  return canvas
}

function loadCanvasImage(canvas: OffscreenCanvas2D, src: string): Promise<WechatMiniprogram.Image> {
  return new Promise((resolve, reject) => {
    const image = canvas.createImage()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('share image load failed'))
    image.src = src
  })
}

function exportCanvasImage(canvas: OffscreenCanvas2D): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      fileType: 'jpg',
      quality: 0.85,
      destWidth: SHARE_CARD_WIDTH,
      destHeight: SHARE_CARD_HEIGHT,
      success: (res) => {
        if (res.tempFilePath) {
          resolve(res.tempFilePath)
          return
        }
        reject(new Error('share image export empty'))
      },
      fail: () => reject(new Error('share image export failed')),
    })
  })
}
