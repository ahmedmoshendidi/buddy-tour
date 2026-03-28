import React from 'react';
import { Button } from '../ui/button';
import { Clock } from 'lucide-react';

interface TimeSlot {
  time: string;
  date: string;
  language?: string;
}

interface TimeSelectorProps {
  availableTimes: TimeSlot[];
  selectedTime: string;
  selectedDate: string;
  onTimeSelect: (time: string) => void;
}

export default function TimeSelector({
  availableTimes,
  selectedTime,
  selectedDate,
  onTimeSelect
}: TimeSelectorProps) {
  return (
    <div>
      <h3 className="text-lg mb-4 text-primary flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        Select Time Slot
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availableTimes.length > 0 ? (
          availableTimes.map((slot, index) => (
            <Button
              key={`${slot.date}-${slot.time}-${index}`}
              variant={selectedTime === slot.time ? "default" : "outline"}
              onClick={() => onTimeSelect(slot.time)}
              className={`
                ${selectedTime === slot.time 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
                }
              `}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-semibold">{slot.time.slice(0, 5)}</span>
                {slot.language && (
                  <span className="opacity-90">{slot.language}</span>
                )}
              </div>
            </Button>
          ))
        ) : (
          <div className="col-span-full text-center py-6">
            {selectedDate ? (
              <div className="space-y-2">
                <p className="text-muted-foreground">No available times for this date.</p>
                <p className="text-sm text-muted-foreground">Please select a different date.</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Please select a date first.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}