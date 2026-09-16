"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import CalendarThree from "@/components/ui/calendar-03";
import { fetchMonthlySlots } from "./api.js";

interface AppointmentPickerBridgeProps {
  mentorId: number;
  initialYear?: number;
  initialMonth?: number;
  onSlotSelected?: (dateStr: string, displayDate: string, time: string) => void;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const AppointmentPickerBridge: React.FC<AppointmentPickerBridgeProps> = ({
  mentorId,
  initialYear = 2026,
  initialMonth = 9,
  onSlotSelected,
}) => {
  // Default to 16 September 2026
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(initialYear, initialMonth - 1, 16)
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slotsData, setSlotsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadSlots = async () => {
      setLoading(true);
      const year = selectedDate ? selectedDate.getFullYear() : initialYear;
      const month = selectedDate ? selectedDate.getMonth() + 1 : initialMonth;
      try {
        const data = await fetchMonthlySlots(mentorId, year, month);
        if (isMounted) {
          setSlotsData(data);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to load slots in appointment picker", e);
        if (isMounted) setLoading(false);
      }
    };
    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [mentorId, selectedDate?.getMonth(), selectedDate?.getFullYear()]);

  // Compute available slots for the currently selected day
  const dateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(
        selectedDate.getDate()
      ).padStart(2, "0")}`
    : "";

  const dayObj = slotsData?.days?.find((d: any) => d.date === dateStr);
  const daySlots: string[] = dayObj?.slots || [
    "09:30 AM",
    "10:00 AM",
    "11:30 AM",
    "02:00 PM",
    "03:30 PM",
    "04:30 PM",
  ];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (window.__updateBookingBar) {
      window.__updateBookingBar("", "");
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const dayOfWeek = dayNames[selectedDate.getDay()];
      const mName = monthNames[selectedDate.getMonth()];
      const displayDate = `${dayOfWeek} ${selectedDate.getDate()} ${mName}`;
      
      window.__selectedDay = displayDate;
      window.__selectedSlot = time;

      if (onSlotSelected) {
        onSlotSelected(dateStr, displayDate, time);
      }

      if (window.__updateBookingBar) {
        window.__updateBookingBar(displayDate, time);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-2xl mb-3 flex items-center justify-between px-4 text-xs font-semibold text-cocoa-ink/70">
        <span>⏰ times displayed in UK BST (London time)</span>
        <span className="text-marker-orange font-bold">
          {slotsData?.totalOpenSlots ? `● ${slotsData.totalOpenSlots} total sessions this month` : "● 30+ open sessions"}
        </span>
      </div>

      <CalendarThree
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        availableTimes={daySlots}
        onSelectDate={handleDateSelect}
        onSelectTime={handleTimeSelect}
      />

      <div className="mt-4 text-center text-xs text-cocoa-ink/60 font-medium">
        💡 Pick any day on the calendar, then choose a 20-min session on the right.
      </div>
    </div>
  );
};

let activeRoot: ReactDOM.Root | null = null;

export function mountAppointmentPicker(containerId: string, mentorId: number) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!activeRoot) {
    activeRoot = ReactDOM.createRoot(container);
  }

  activeRoot.render(
    <AppointmentPickerBridge
      mentorId={mentorId}
      initialYear={2026}
      initialMonth={9}
    />
  );
}

// Attach to window so vanilla router can call it
(window as any).mountAppointmentPicker = mountAppointmentPicker;
