import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, startOfDay } from 'date-fns';

function MedicationCalendar({ medication, onToggleDay }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const isDateInDuration = (date) => {
    if (!medication?.startDate || !medication?.endDate) return false;
    const startDate = new Date(medication.startDate);
    const endDate = new Date(medication.endDate);
    return isWithinInterval(startOfDay(date), { 
      start: startOfDay(startDate), 
      end: startOfDay(endDate) 
    });
  };

  const isTimingTakenForDate = (timing, date) => {
    return timing?.takenDates?.some(takenDate => 
      isSameDay(new Date(takenDate), date)
    ) || false;
  };

  const areAllTimingsTakenForDate = (date) => {
    if (!medication?.timings) return false;
    return medication.timings.every(timing => isTimingTakenForDate(timing, date));
  };

  const handleDayClick = (date, timingId) => {
    if (isDateInDuration(date)) {
      onToggleDay(date, timingId);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {medication?.pillName} ({medication?.dosage})
        </h3>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="px-3 py-1 text-gray-600 hover:text-gray-800"
        >
          ←
        </button>
        <h4 className="text-lg font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <button
          onClick={nextMonth}
          className="px-3 py-1 text-gray-600 hover:text-gray-800"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 p-2"
          >
            {day}
          </div>
        ))}
        
        {days.map((day) => {
          const isInDuration = isDateInDuration(day);
          const allTaken = areAllTimingsTakenForDate(day);
          
          return (
            <div
              key={day.toISOString()}
              className={`
                p-2 rounded-lg
                ${!isInDuration ? 'bg-gray-100' : 
                  allTaken ? 'bg-green-100' : 'bg-white'}
              `}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {medication?.timings?.map((timing) => {
                  const isTaken = isTimingTakenForDate(timing, day);
                  return (
                    <button
                      key={timing._id}
                      onClick={() => handleDayClick(day, timing._id)}
                      disabled={!isInDuration}
                      className={`
                        w-full text-xs py-1 px-2 rounded transition-colors
                        ${!isInDuration ? 'text-gray-400 cursor-not-allowed' :
                          isTaken ? 'bg-green-500 text-white hover:bg-green-600' :
                          'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'}
                      `}
                    >
                      {formatTime(timing.time)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MedicationCalendar; 