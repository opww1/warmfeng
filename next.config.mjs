/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // 静态导出,供 Capacitor 打包成 APK
  output: 'export',
  // 静态导出不支持 next/image 优化
  images: {
    unoptimized: true,
  },
  // trailingSlash 让 Capacitor 文件协议加载更稳
  trailingSlash: true,
}

export default nextConfig