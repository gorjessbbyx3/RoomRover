import React from 'react';

export class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // Log error
    console.error(error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div role="alert">Something went wrong.</div>;
    }
    return this.props.children;
  }
}
