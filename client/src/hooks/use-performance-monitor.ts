
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTimes: Record<string, number[]>;
  renderTimes: Record<string, number>;
  memoryUsage?: number;
  errorCount: number;
  lastError?: string;
}

export function usePerformanceMonitor(componentName?: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTimes: {},
    renderTimes: {},
    errorCount: 0,
  });
  
  const queryClient = useQueryClient();
  const renderStartTime = useRef(Date.now());
  const componentMountTime = useRef(Date.now());

  useEffect(() => {
    // Record page load time
    if (performance && performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));
    }

    // Record component render time
    if (componentName) {
      const renderTime = Date.now() - renderStartTime.current;
      setMetrics(prev => ({
        ...prev,
        renderTimes: { ...prev.renderTimes, [componentName]: renderTime }
      }));
    }

    // Monitor memory usage if available
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memInfo.usedJSHeapSize / 1048576 // Convert to MB
      }));
    }

    // Set up error monitoring
    const errorHandler = (event: ErrorEvent) => {
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        lastError: event.message
      }));
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        lastError: String(event.reason)
      }));
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, [componentName]);

  // Monitor API response times
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const start = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - start;
        
        if (url.startsWith('/api/')) {
          setMetrics(prev => {
            const existingTimes = prev.apiResponseTimes[url] || [];
            return {
              ...prev,
              apiResponseTimes: {
                ...prev.apiResponseTimes,
                [url]: [...existingTimes.slice(-9), duration] // Keep last 10 measurements
              }
            };
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - start;
        setMetrics(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          lastError: `API Error: ${url}`
        }));
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const getAverageApiTime = (endpoint: string) => {
    const times = metrics.apiResponseTimes[endpoint];
    if (!times || times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  };

  const getSlowEndpoints = (threshold = 1000) => {
    return Object.keys(metrics.apiResponseTimes).filter(
      endpoint => getAverageApiTime(endpoint) > threshold
    );
  };

  const exportMetrics = () => {
    const report = {
      ...metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentUptime: Date.now() - componentMountTime.current,
      slowEndpoints: getSlowEndpoints(),
      queryCache: {
        size: queryClient.getQueryCache().getAll().length,
        invalidQueries: queryClient.getQueryCache().getAll().filter(q => q.state.isInvalidated).length,
      }
    };

    console.log('Performance Report:', report);
    return report;
  };

  const trackCustomMetric = (name: string, value: number) => {
    setMetrics(prev => ({
      ...prev,
      renderTimes: { ...prev.renderTimes, [name]: value }
    }));
  };

  return {
    metrics,
    getAverageApiTime,
    getSlowEndpoints,
    exportMetrics,
    trackCustomMetric,
  };
}

// Performance reporting utility
export function reportPerformance(metrics: PerformanceMetrics) {
  if (process.env.NODE_ENV === 'development') {
    console.group('🚀 Performance Metrics');
    console.log('Page Load Time:', metrics.pageLoadTime + 'ms');
    console.log('Render Times:', metrics.renderTimes);
    console.log('API Response Times:', 
      Object.entries(metrics.apiResponseTimes).map(([url, times]) => ({
        url,
        average: times.reduce((sum, time) => sum + time, 0) / times.length,
        latest: times[times.length - 1]
      }))
    );
    if (metrics.memoryUsage) {
      console.log('Memory Usage:', metrics.memoryUsage.toFixed(2) + 'MB');
    }
    console.log('Error Count:', metrics.errorCount);
    console.groupEnd();
  }
}
