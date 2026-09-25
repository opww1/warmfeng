import { WarmFengApp } from '@/components/warm-feng-app'
import { AppErrorBoundary } from '@/components/app-error-boundary'

export default function Home() {
  return (
    <AppErrorBoundary>
      <WarmFengApp />
    </AppErrorBoundary>
  )
}
