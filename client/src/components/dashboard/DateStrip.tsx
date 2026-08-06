import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateStripProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

export function DateStrip({ selectedDate = new Date(), onSelectDate }: DateStripProps) {
  const [currentStart, setCurrentStart] = useState(subDays(selectedDate, 2));

  // Render 7 days starting from currentStart
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentStart, i));

  const handlePrev = () => setCurrentStart((prev) => subDays(prev, 7));
  const handleNext = () => setCurrentStart((prev) => addDays(prev, 7));
  const handleToday = () => {
    const today = new Date();
    setCurrentStart(subDays(today, 2));
    onSelectDate?.(today);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleToday} className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrev} className="h-7 w-7">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext} className="h-7 w-7">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate?.(day)}
              className={`group relative flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-all ${
                isSelected
                  ? 'bg-foreground text-background shadow-md'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`text-[10px] font-medium uppercase tracking-wider ${isSelected ? 'opacity-80' : ''}`}>
                {format(day, 'EEE')}
              </span>
              <span className={`mt-0.5 text-base font-bold ${isSelected ? 'text-background' : 'text-foreground'}`}>
                {format(day, 'd')}
              </span>

              {isToday && !isSelected && (
                <motion.div
                  layoutId="date-strip-today"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
