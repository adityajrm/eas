
import React, { useMemo } from 'react';
import { format, startOfDay, eachDayOfInterval, differenceInDays, addDays, isSameDay, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarEvent } from '@/types';
import { motion } from 'framer-motion';

interface GanttChartProps {
  events: CalendarEvent[];
  startDate?: Date;
  days?: number;
}

const GanttChart: React.FC<GanttChartProps> = ({
  events,
  startDate = new Date(),
  days = 7
}) => {
  // Generate array of dates to display
  const dates = useMemo(() => {
    const start = startOfDay(startDate);
    return Array.from({
      length: days
    }, (_, i) => addDays(start, i));
  }, [startDate, days]);

  // Group events by category for color consistency
  const categoriesMap = useMemo(() => {
    const map = new Map<string, string>();
    const colors = [
      'bg-blue-200 dark:bg-blue-900', 
      'bg-green-200 dark:bg-green-900', 
      'bg-yellow-200 dark:bg-yellow-900', 
      'bg-purple-200 dark:bg-purple-900', 
      'bg-pink-200 dark:bg-pink-900', 
      'bg-orange-200 dark:bg-orange-900', 
      'bg-indigo-200 dark:bg-indigo-900', 
      'bg-red-200 dark:bg-red-900'
    ];
    let colorIndex = 0;
    events.forEach(event => {
      if (event.category && !map.has(event.category)) {
        map.set(event.category, colors[colorIndex % colors.length]);
        colorIndex++;
      }
    });
    return map;
  }, [events]);

  // Parse and validate event dates
  const validEvents = useMemo(() => {
    return events.map(event => {
      const startDate = event.start instanceof Date ? event.start : new Date(event.start);
      const endDate = event.end instanceof Date ? event.end : new Date(event.end);
      
      return {
        ...event,
        start: startDate,
        end: endDate
      };
    }).filter(event => !isNaN(event.start.getTime()) && !isNaN(event.end.getTime()));
  }, [events]);
  
  return (
    <Card className="w-full overflow-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Timeline View</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full min-w-[800px]">
          {/* Date header */}
          <div className="flex border-b">
            <div className="w-1/5 min-w-[180px] p-2 font-medium">Event</div>
            <div className="flex flex-1">
              {dates.map((date, index) => (
                <div key={index} className="flex-1 p-2 text-center font-medium text-sm border-l">
                  <div>{format(date, 'EEE')}</div>
                  <div>{format(date, 'd MMM')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Events */}
          {validEvents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No events to display in this timeframe
            </div>
          ) : (
            <div className="divide-y">
              {validEvents.map(event => {
                // Find the first day in our range that contains this event
                const firstVisibleDay = dates.findIndex(date => 
                  isWithinInterval(date, { start: event.start, end: event.end }) ||
                  isSameDay(date, event.start) ||
                  (date > event.start && date <= event.end)
                );
                
                // Find how many days this event spans within our visible range
                const lastVisibleDayIndex = dates.findIndex(date => 
                  date > event.end && !isSameDay(date, event.end)
                );
                
                // Calculate position and span
                const startPos = firstVisibleDay >= 0 ? firstVisibleDay : 0;
                const endPos = lastVisibleDayIndex === -1 ? dates.length : lastVisibleDayIndex;
                const span = Math.max(1, endPos - startPos);
                
                // Skip events completely outside the visible range
                if (startPos >= dates.length || 
                    (event.end < dates[0] && !isSameDay(event.end, dates[0])) || 
                    (event.start > dates[dates.length - 1] && !isSameDay(event.start, dates[dates.length - 1]))) {
                  return null;
                }
                
                const categoryColor = event.category 
                  ? categoriesMap.get(event.category) || 'bg-gray-200 dark:bg-gray-700' 
                  : 'bg-gray-200 dark:bg-gray-700';
                
                return (
                  <div key={event.id} className="flex items-center">
                    <div className="w-1/5 min-w-[160px] p-3 truncate">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                      </div>
                    </div>
                    <div className="flex flex-1 h-10 items-center relative">
                      <motion.div 
                        className={`absolute h-6 rounded-md m-1 ${categoryColor} border border-background/20 flex items-center justify-center text-xs font-medium truncate px-2`} 
                        style={{
                          left: `${(startPos / dates.length) * 100}%`,
                          width: `${(span / dates.length) * 100}%`
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5 }}
                        title={event.title}
                      >
                        {span > 1 ? event.title : ''}
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;
