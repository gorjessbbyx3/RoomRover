
import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
}

export default function CountdownTimer({ expiresAt, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (timeLeft.isExpired) {
    return (
      <Badge variant="destructive" className={`flex items-center gap-1 ${className}`}>
        <AlertTriangle className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  const isUrgent = timeLeft.days < 7;
  const variant = isUrgent ? (timeLeft.days < 3 ? 'destructive' : 'secondary') : 'default';

  return (
    <Badge variant={variant} className={`flex items-center gap-1 font-mono ${className}`}>
      <Clock className="h-3 w-3" />
      {timeLeft.days > 0 && `${timeLeft.days}d `}
      {String(timeLeft.hours).padStart(2, '0')}:
      {String(timeLeft.minutes).padStart(2, '0')}:
      {String(timeLeft.seconds).padStart(2, '0')}
    </Badge>
  );
}
import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string | Date;
  className?: string;
}

export default function CountdownTimer({ expiresAt, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiryDate = new Date(expiresAt);
      const now = new Date();
      const difference = expiryDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft(null);
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Expired</span>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const isExpiringSoon = timeLeft.days < 7;

  return (
    <div className={`flex items-center gap-2 ${isExpiringSoon ? 'text-orange-600' : 'text-gray-700'} ${className}`}>
      <Clock className="h-4 w-4" />
      <div className="text-sm">
        {timeLeft.days > 0 && (
          <span className="font-medium">
            {timeLeft.days}d {timeLeft.hours}h
          </span>
        )}
        {timeLeft.days === 0 && (
          <span className="font-medium">
            {timeLeft.hours}h {timeLeft.minutes}m
          </span>
        )}
        {timeLeft.days === 0 && timeLeft.hours === 0 && (
          <span className="font-medium text-red-600">
            {timeLeft.minutes}m {timeLeft.seconds}s
          </span>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: string | Date;
  className?: string;
  showIcon?: boolean;
}

export function CountdownTimer({ expiresAt, className, showIcon = true }: CountdownTimerProps) {
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

  useEffect(() => {
    const calculateTimeLeft = () => {
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
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
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
