import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expirationTime: Date | string;
  onExpire?: () => void;
  className?: string;
}

export default function CountdownTimer({ expirationTime, onExpire, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Use a stable ref for onExpire so parent re-renders (changing the callback reference)
  // do not constantly tear down and recreate the interval timer.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiration = new Date(expirationTime);
      const now = new Date();
      const diff = expiration.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft(0);
        onExpireRef.current?.();
        return 0;
      }
      
      return Math.floor(diff / 1000); // Convert to seconds
    };

    // Calculate initial time
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expirationTime]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 0) return 'text-red-600';
    if (timeLeft <= 300) return 'text-orange-600'; // Last 5 minutes
    return 'text-amber-600';
  };

  const getBackgroundColor = () => {
    if (timeLeft <= 0) return 'bg-red-50 border-red-200';
    if (timeLeft <= 300) return 'bg-orange-50 border-orange-200'; // Last 5 minutes
    return 'bg-amber-50 border-amber-200';
  };

  if (timeLeft <= 0) {
    return (
      <div className={`rounded-lg p-4 text-center border ${getBackgroundColor()} ${className}`}>
        <div className="flex items-center justify-center gap-2 text-red-600 font-medium">
          <Clock className="h-4 w-4" />
          <span>⏰ Your seat reservation has expired</span>
        </div>
        <div className="text-sm text-red-500 mt-1">
          Please select your seats again to reserve them.
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 text-center border ${getBackgroundColor()} ${className}`}>
      <div className="flex items-center justify-center gap-2 font-medium mb-1">
        <Clock className={`h-4 w-4 ${getTimerColor()}`} />
        <span className={getTimerColor()}>
          🔒 We'll hold your spot for{' '}
          <span className="font-mono text-lg bg-white px-2 py-1 rounded border">
            {formatTime(timeLeft)}
          </span>
          {' '}minutes
        </span>
      </div>
      <div className="text-sm text-gray-600">
        Complete your booking before the timer expires
      </div>
      {timeLeft <= 300 && ( // Show urgency message in last 5 minutes
        <div className="text-sm font-medium text-orange-600 mt-2">
          ⚡ Hurry! Only {Math.ceil(timeLeft / 60)} minutes left
        </div>
      )}
    </div>
  );
}