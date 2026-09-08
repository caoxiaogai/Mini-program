import { prepareMediaUrl } from './media'

/** 与素材列表卡片预览一致：内容区左右 40rpx、两列间距 18rpx、预览高度 460rpx */
export const MATERIAL_LIST_PREVIEW_WIDTH_RPX = (750 - 40 * 2 - 18) / 2
export const MATERIAL_LIST_PREVIEW_HEIGHT_RPX = 460

/** 微信分享卡片显示比例为 5:4，先按此尺寸出图，避免平台再裁切。 */
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

export function containDestRect(
  innerWidth: number,
  innerHeight: number,
  outerWidth: number,
  outerHeight: number,
): { dx: number; dy: number; dw: number; dh: number } {
  if (innerWidth <= 0 || innerHeight <= 0 || outerWidth <= 0 || outerHeight <= 0) {
    return { dx: 0, dy: 0, dw: 0, dh: 0 }
  }

  const scale = Math.min(outerWidth / innerWidth, outerHeight / innerHeight)
  const dw = innerWidth * scale
  const dh = innerHeight * scale
  return {
    dx: (outerWidth - dw) / 2,
    dy: (outerHeight - dh) / 2,
    dw,
    dh,
  }
}

/** 与列表 `mode="aspectFill"` 相同：铺满盒子、居中裁切溢出。 */
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

/** 生成好友/朋友圈分享图：按素材列表预览框 aspectFill，再放入 5:4 卡片。 */
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

  const frame = containDestRect(
    MATERIAL_LIST_PREVIEW_WIDTH_RPX,
    MATERIAL_LIST_PREVIEW_HEIGHT_RPX,
    SHARE_CARD_WIDTH,
    SHARE_CARD_HEIGHT,
  )
  const image = await loadCanvasImage(canvas, info.path)
  const draw = coverDestRect(info.width, info.height, frame.dx, frame.dy, frame.dw, frame.dh)

  ctx.save()
  ctx.beginPath()
  ctx.rect(frame.dx, frame.dy, frame.dw, frame.dh)
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
