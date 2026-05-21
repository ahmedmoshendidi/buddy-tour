import React from 'react';
import { Button } from '../ui/button';
import { CalendarIcon } from 'lucide-react';

interface TimeSlot {
  time: string;
  date: string;
}

interface DateSelectorProps {
  timeSlots: TimeSlot[];
  selectedDate: string;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onDateSelect: (date: string) => void;
}

export default function DateSelector({
  timeSlots,
  selectedDate,
  currentMonth,
  setCurrentMonth,
  onDateSelect
}: DateSelectorProps) {
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
      // ONLY show available if there are actual time slots in database for this date
      const hasSlots = timeSlots.some(slot => slot.date === dateStr);

      const handleDateClick = (selectedDateStr: string) => {
        if (isPast || !hasSlots) return;
        onDateSelect(selectedDateStr);
      };

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(dateStr)}
          disabled={isPast || !hasSlots}
          className={`
            p-2 m-1 rounded-md font-medium transition-all duration-200 min-h-[40px] min-w-[40px] relative
            ${isPast || !hasSlots
              ? 'text-muted-foreground cursor-not-allowed bg-muted/30' 
              : 'hover:bg-primary/10 cursor-pointer'
            }
            ${isSelected 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'text-foreground'
            }
            ${isToday && !isSelected && selectedDate === ''
              ? 'ring-2 ring-primary ring-offset-2' 
              : ''
            }
          `}
        >
          {day}
          {/* Show indicator for dates with available slots */}
          {hasSlots && !isSelected && !isPast && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div>
      <h3 className="text-lg mb-4 text-primary flex items-center">
        <CalendarIcon className="h-5 w-5 mr-2" />
        Choose a Tour Date
      </h3>
      
      <div className="bg-gradient-to-br from-teal-50 to-amber-50 p-6 rounded-lg border">
        <div className="text-center mb-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentMonth(newDate);
              }}
            >
              ‹
            </Button>
            <h4 className="font-semibold">
              {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentMonth(newDate);
              }}
            >
              ›
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="p-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {generateCalendar()}
        </div>
      </div>
    </div>
  );
}