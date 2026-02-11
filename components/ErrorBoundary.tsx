'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '@iconify/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="lucide:alert-circle" className="w-5 h-5" />
            <p className="text-sm font-medium">加载组件时出现错误</p>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300">
            请刷新页面重试
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
