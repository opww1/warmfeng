/**
 * 手绘风 path 生成器（暖枫进度条 / 加载组件用）
 *
 * 关键原则（见规范「七 / 十」）：
 * - 描边不规则感只在「挂载时」生成一次（seed 固定），进度更新绝不重新生成，
 *   否则每帧描边会抖动造成视觉噪音。
 * - 预置多种 seed 由调用方在挂载时随机选定一套，模拟不同手绘笔迹。
 */

/** 确定性随机数（mulberry32），保证同一 seed 每次生成一致路径 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 生成带轻微不规则的手绘圆角矩形 path（pill 形）。
 * 坐标空间：0..w（x）、0..h（y）。直边中点加轻微 bow，端点加 ±0.5px 抖动。
 */
export function wobblyRoundedRect(w: number, h: number, r: number, seed = 1): string {
  const rng = mulberry32(seed)
  const j = () => (rng() - 0.5) * 1.0
  const rr = Math.max(0, Math.min(r, h / 2, w / 2))
  const J = (n: number) => (n + j()).toFixed(2)
  const bow = (a: [number, number], b: [number, number]) => {
    const mx = (a[0] + b[0]) / 2 + j()
    const my = (a[1] + b[1]) / 2 + j()
    return `${mx.toFixed(2)} ${my.toFixed(2)}`
  }
  const topL: [number, number] = [rr, 0]
  const topR: [number, number] = [w - rr, 0]
  const rightT: [number, number] = [w, rr]
  const rightB: [number, number] = [w, h - rr]
  const botR: [number, number] = [w - rr, h]
  const botL: [number, number] = [rr, h]
  const leftB: [number, number] = [0, h - rr]
  const leftT: [number, number] = [0, rr]
  return [
    `M ${J(topL[0])} ${J(topL[1])}`,
    `Q ${bow(topL, topR)} ${J(topR[0])} ${J(topR[1])}`,
    `A ${rr} ${rr} 0 0 1 ${J(rightT[0])} ${J(rightT[1])}`,
    `Q ${bow(rightT, rightB)} ${J(rightB[0])} ${J(rightB[1])}`,
    `A ${rr} ${rr} 0 0 1 ${J(botR[0])} ${J(botR[1])}`,
    `Q ${bow(botR, botL)} ${J(botL[0])} ${J(botL[1])}`,
    `A ${rr} ${rr} 0 0 1 ${J(leftB[0])} ${J(leftB[1])}`,
    `Q ${bow(leftB, leftT)} ${J(leftT[0])} ${J(leftT[1])}`,
    `A ${rr} ${rr} 0 0 1 ${J(topL[0])} ${J(topL[1])}`,
    'Z',
  ].join(' ')
}

/** 生成带轻微径向抖动的手绘圆 path（用于环形 loader 描边） */
export function wobblyCircle(cx: number, cy: number, radius: number, seed = 1): string {
  const rng = mulberry32(seed)
  const steps = 28
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const r = radius + (rng() - 0.5) * 1.0
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)} `
  }
  return d + 'Z'
}

/** 预置 4 套手绘模板 seed，挂载时随机选一套 */
export const HAND_DRAWN_SEEDS = [11, 27, 43, 58]
