"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar-03-utils/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";

export const title = "Calendar as Appointment Picker";

export interface CalendarThreeProps {
  date?: Date | undefined;
  onSelectDate?: (date: Date | undefined) => void;
  selectedDate?: Date | undefined;
  selectedTime?: string | null;
  onSelectTime?: (time: string) => void;
  availableTimes?: string[];
  className?: string;
}

const CalendarThree = ({
  date: propDate,
  selectedDate,
  onSelectDate,
  selectedTime: propSelectedTime,
  onSelectTime,
  availableTimes: propTimes,
  className = "",
}: CalendarThreeProps = {}) => {
  const [internalDate, setInternalDate] = useState<Date | undefined>(new Date());
  const [internalSelectedTime, setInternalSelectedTime] = useState<string | null>(null);

  const date = selectedDate !== undefined ? selectedDate : (propDate !== undefined ? propDate : internalDate);
  const selectedTime = propSelectedTime !== undefined ? propSelectedTime : internalSelectedTime;

  const defaultTimes = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ];

  const availableTimes = propTimes && propTimes.length > 0 ? propTimes : defaultTimes;

  const handleDateChange = (newDate: Date | undefined) => {
    setInternalDate(newDate);
    setInternalSelectedTime(null);
    if (onSelectDate) {
      onSelectDate(newDate);
    }
    if (typeof window !== "undefined" && (window as any).__updateBookingBar) {
      (window as any).__updateBookingBar("", "");
    }
  };

  const handleTimeClick = (time: string) => {
    setInternalSelectedTime(time);
    if (onSelectTime) {
      onSelectTime(time);
    }
    if (typeof window !== "undefined") {
      const activeDate = date || new Date();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dayOfWeek = dayNames[activeDate.getDay()];
      const mName = monthNames[activeDate.getMonth()];
      const displayDate = `${dayOfWeek} ${activeDate.getDate()} ${mName}`;

      (window as any).__selectedDay = displayDate;
      (window as any).__selectedSlot = time;

      if ((window as any).__updateBookingBar) {
        (window as any).__updateBookingBar(displayDate, time);
      }
    }
  };

  return (
    <div className={`flex items-center justify-center px-4 ${className}`}>
      <div className="flex divide-x divide-charcoal/15 overflow-hidden rounded-xl border border-charcoal/20 bg-background shadow-md">
        <Calendar mode="single" onSelect={handleDateChange} selected={date} />
        <div className="relative w-[249px] overflow-hidden">
          <div className="absolute inset-0 grid gap-4">
            <div className="space-y-1 px-4 pt-4 border-b border-charcoal/10 pb-3">
              <p className="text-center text-sm font-bold text-foreground">Available Times</p>
              <p className="text-center text-[11px] text-muted-foreground font-medium">20-min 1-on-1 calls (UK BST)</p>
            </div>
            <ScrollArea className="h-full overflow-y-auto">
              <div className="grid grid-cols-1 gap-2 px-4 pb-4">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    onClick={() => handleTimeClick(time)}
                    size="sm"
                    variant={selectedTime === time ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      selectedTime === time
                        ? "font-bold shadow-xs scale-[1.02]"
                        : "hover:bg-accent hover:border-charcoal/30"
                    }`}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarThree;
