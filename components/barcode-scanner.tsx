"use client"

import * as React from "react"
import { motion } from "motion/react"
import { X, Loader2 } from "lucide-react"

/**
 * 全屏相机扫码层（预包装食品条码）。
 * 用 @zxing/browser 在浏览器内解 1D 条码（EAN-13 / UPC 等）。
 *
 * 性能策略（修复运行几秒后严重掉帧的问题，三处开销同时处理）：
 * 1. 解码节流：不用 decodeFromVideoDevice（每帧全分辨率解码），
 *    改为 400ms 一次的定时器 + 缩到 480px 宽的小画布再解码
 * 2. 限制相机规格：分辨率封顶 1280x720、帧率封顶 30fps，
 *    避免设备给出 4K 高帧率流拖垮 WebView
 * 3. 取景框遮罩不用 9999px 扩散阴影（视频每帧更新都会连带整块阴影重绘，
 *    这是上一版仍然卡顿的主因），改用四块静态半透明面板拼出暗区
 */
export function BarcodeScannerSheet({
  onClose,
  onScanned,
}: {
  onClose: () => void
  onScanned: (barcode: string) => void
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const stopRef = React.useRef<(() => void) | null>(null)
  const doneRef = React.useRef(false)
  const [starting, setStarting] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // 用 ref 固定回调，避免父组件重渲染导致相机反复重启
  const onScannedRef = React.useRef(onScanned)
  React.useEffect(() => {
    onScannedRef.current = onScanned
  }, [onScanned])

  React.useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let timer: number | null = null

    ;(async () => {
      try {
        const [{ BrowserMultiFormatReader }, zxingLib] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ])
        if (cancelled) return
        const video = videoRef.current
        if (!video) return

        // 只解食品包装上常见的 1D 条码，减少每次解码的无效探测
        const hints = new Map()
        hints.set(zxingLib.DecodeHintType.POSSIBLE_FORMATS, [
          zxingLib.BarcodeFormat.EAN_13,
          zxingLib.BarcodeFormat.EAN_8,
          zxingLib.BarcodeFormat.UPC_A,
          zxingLib.BarcodeFormat.UPC_E,
          zxingLib.BarcodeFormat.CODE_128,
          zxingLib.BarcodeFormat.CODE_39,
        ])
        const reader = new BrowserMultiFormatReader(hints)

        // 分辨率/帧率封顶：够扫条码即可，防止设备给出超大视频流
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 960, max: 1280 },
            height: { ideal: 540, max: 720 },
            frameRate: { ideal: 24, max: 30 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        video.srcObject = stream
        await video.play().catch(() => {
          /* 部分设备自动播放即生效，忽略 */
        })
        setStarting(false)

        // 解码用的小画布：宽度压到 480，条码识别足够且开销低
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })

        timer = window.setInterval(() => {
          if (doneRef.current || !video || video.readyState < 2) return
          const vw = video.videoWidth
          const vh = video.videoHeight
          if (!vw || !vh) return
          const scale = Math.min(1, 480 / vw)
          canvas.width = Math.round(vw * scale)
          canvas.height = Math.round(vh * scale)
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
          try {
            const result = reader.decodeFromCanvas(canvas)
            const code = result?.getText()
            if (!code || doneRef.current) return
            doneRef.current = true
            onScannedRef.current(code)
          } catch {
            /* 本轮没识别到（NotFoundException），等下一轮 */
          }
        }, 400)

        stopRef.current = () => {
          if (timer !== null) {
            clearInterval(timer)
            timer = null
          }
          stream?.getTracks().forEach((t) => t.stop())
        }
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : String(e)
        if (/Permission|NotAllowed|denied/i.test(msg)) {
          setError("相机权限被拒绝了，请在系统设置里允许后重试，或用「手动添加」")
        } else if (/NotFound|Requested device|no .* found/i.test(msg)) {
          setError("没找到摄像头，请用「手动添加」")
        } else {
          setError("相机启动失败：" + msg)
        }
        setStarting(false)
      }
    })()

    return () => {
      cancelled = true
      stopRef.current?.()
    }
    // 只在挂载时启动一次相机；回调走 ref，不作为依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 顶部关闭栏（避让状态栏） */}
      <div className="flex items-center justify-between px-4 pt-[calc(1rem+var(--wi-sb,0px))] text-white">
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition active:scale-90"
        >
          <X className="h-6 w-6" />
        </button>
        <p className="text-sm">把条码对准取景框</p>
        <div className="h-10 w-10" />
      </div>

      {/* 相机预览 + 取景框 */}
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

        {/* 取景框外暗区：四块静态面板拼出，替代 9999px 扩散阴影（视频每帧更新不再触发大面积重绘） */}
        <div className="pointer-events-none absolute inset-0">
          {/* 上 / 下暗区 */}
          <div className="absolute inset-x-0 top-0 h-[calc(50%-5.5rem)] bg-black/45" />
          <div className="absolute inset-x-0 bottom-0 h-[calc(50%-5.5rem)] bg-black/45" />
          {/* 左 / 右暗区（与取景框等高） */}
          <div className="absolute left-0 top-[calc(50%-5.5rem)] h-44 w-[calc(50%-9rem)] bg-black/45" />
          <div className="absolute right-0 top-[calc(50%-5.5rem)] h-44 w-[calc(50%-9rem)] bg-black/45" />
          {/* 取景框描边 + 顶部装饰条 */}
          <div className="absolute left-1/2 top-1/2 h-44 w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/80">
            <div className="absolute -top-2 left-1/2 h-1 w-12 -translate-x-1/2 rounded bg-[#D4537E]" />
          </div>
        </div>

        {starting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {error && (
          <div className="absolute inset-x-6 bottom-10 rounded-2xl bg-black/70 p-4 text-center text-sm text-white">
            {error}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 block w-full rounded-xl bg-white/15 py-2 text-white transition active:scale-95"
            >
              返回
            </button>
          </div>
        )}
      </div>

      <p className="pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-white/60">
        仅用于识别食品，不会上传你的摄像头画面
      </p>
    </motion.div>
  )
}
