'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    if (typeof window !== 'undefined') {
      window.__WARM_ERROR__ = { error: error.toString(), stack: error.stack || '', componentStack: errorInfo.componentStack || '' }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FBF7F2] p-6 text-[#5A4A45]">
          <div className="w-full max-w-[430px] rounded-[28px] bg-white p-6 shadow-xl">
            <h1 className="mb-4 font-serif text-[20px] font-semibold text-[#E8A0A8]">暖枫遇到了一点小问题</h1>
            <p className="mb-4 text-[14px] text-muted-foreground">应用在运行过程中出现了异常，您可以尝试重新加载页面。如果问题持续出现，请重启应用。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { this.setState({ hasError: false, error: undefined, errorInfo: undefined }) }}
                className="flex-1 rounded-[16px] border border-[#E8D5C8] px-4 py-2.5 text-[14px] text-[#5A4A45] active:bg-[#F5EDE5]"
              >
                重试
              </button>
              <button
                onClick={() => { if (typeof window !== 'undefined') window.location.reload() }}
                className="flex-1 rounded-[16px] bg-[#E8A0A8] px-4 py-2.5 text-[14px] text-white active:bg-[#D88EA0]"
              >
                重新加载
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// 让类型声明接受运行时注入
declare global {
  interface Window {
    __WARM_ERROR__?: { error: string; stack: string; componentStack: string }
  }
}
