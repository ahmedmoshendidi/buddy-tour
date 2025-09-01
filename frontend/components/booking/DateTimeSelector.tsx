import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimeSlot {
  time: string;
  date: string;
}

interface DateTimeSelectorProps {
  timeSlots: TimeSlot[];
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

export default function DateTimeSelector({
  timeSlots,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime
}: DateTimeSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const days: React.ReactNode[] = [];

    // Empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const isToday = todayStr === dateStr;
      const isPast = dateStr < todayStr;
      const isSelected = selectedDate === dateStr;
      const hasSlots = timeSlots.some(slot => slot.date === dateStr);

      days.push(
        <button
          key={day}
          onClick={() => {
            if (!isPast && hasSlots) {
              onSelectDate(dateStr);
              // Auto-select first available time for this date
              const availableSlots = timeSlots.filter(slot => slot.date === dateStr);
              if (availableSlots.length > 0) {
                onSelectTime(availableSlots[0].time);
              }
            }
          }}
          disabled={isPast || !hasSlots}
          className={`
            p-2 w-full h-10 text-sm rounded-md transition-colors relative
            ${isPast || !hasSlots ? 'text-muted-foreground cursor-not-allowed' : 'hover:bg-accent'}
            ${isSelected ? 'bg-primary text-primary-foreground' : ''}
            ${isToday && !isSelected ? 'bg-accent' : ''}
          `}
        >
          {day}
          {hasSlots && !isPast && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
          )}
        </button>
      );
    }

    return days;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const availableTimesForSelectedDate = timeSlots.filter(slot => slot.date === selectedDate);

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {generateCalendar()}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-muted rounded-full"></div>
              <span>No availability</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Selection */}
      {selectedDate && availableTimesForSelectedDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Select Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableTimesForSelectedDate.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableTimesForSelectedDate.map((slot) => (
                  <Button
                    key={`${slot.date}-${slot.time}`}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSelectTime(slot.time)}
                    className="justify-center"
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No available time slots for {selectedDate}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}