import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: string | Date;
  className?: string;
  showIcon?: boolean;
}

export default function CountdownTimer({ expiresAt, className, showIcon = true }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const calculateTimeLeft = () => {
      if (!mountedRef.current) return;

      const targetDate = new Date(expiresAt);
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });

        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    timerRef.current = setInterval(calculateTimeLeft, 1000);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [expiresAt]);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  if (timeLeft.isExpired) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="flex items-center gap-2 p-3">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-red-700 font-medium">Expired</span>
        </CardContent>
      </Card>
    );
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <Card className={`${isUrgent ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'} ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {showIcon && (
            <Clock className={`h-4 w-4 ${isUrgent ? 'text-orange-500' : 'text-blue-500'}`} />
          )}
          <div className="flex items-center gap-1">
            {timeLeft.days > 0 && (
              <>
                <span className="font-mono font-bold">{formatTime(timeLeft.days)}</span>
                <span className="text-xs">d</span>
              </>
            )}
            <span className="font-mono font-bold">{formatTime(timeLeft.hours)}</span>
            <span className="text-xs">h</span>
            <span className="font-mono font-bold">{formatTime(timeLeft.minutes)}</span>
            <span className="text-xs">m</span>
            <span className="font-mono font-bold">{formatTime(timeLeft.seconds)}</span>
            <span className="text-xs">s</span>
          </div>
        </div>
        {isUrgent && (
          <div className="text-xs text-orange-600 mt-1">
            Expires soon!
          </div>
        )}
      </CardContent>
    </Card>
  );
}