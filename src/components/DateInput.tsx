import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { isValidDateString, formatDateDisplay, formatDateISO } from "../dateUtils";

interface DateInputProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  label: string;
  placeholder?: string;
}

export default function DateInput({
  value,
  onChange,
  label,
  placeholder = "dd/mm/yyyy",
}: DateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(formatDateDisplay(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    if (inputValue === "") {
      onChange(undefined);
    } else if (isValidDateString(inputValue)) {
      onChange(formatDateISO(inputValue));
    } else {
      // Invalid — revert to last known good value
      setInputValue(formatDateDisplay(value));
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange(undefined);
  };

  const handleDateFromCalendar = (date: Date) => {
    const iso = formatDateISO(date);
    const formatted = formatDateDisplay(date);
    setInputValue(formatted);
    onChange(iso);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="text-xs font-semibold text-github-dim uppercase tracking-wider block mb-1">
        {label}
      </label>
      <div className="flex gap-1">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="input-field text-sm py-2 pr-8 w-full"
          />
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-github-dim hover:text-github-blue transition-colors"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-2 rounded-lg text-github-dim hover:text-github-red hover:bg-github-red/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Calendar Picker — inline, simple toggle */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 z-50 bg-github-card border border-github-border rounded-lg shadow-xl p-4"
        >
          <CalendarPicker onDateSelect={handleDateFromCalendar} value={inputValue} />
        </motion.div>
      )}
    </div>
  );
}

function CalendarPicker({
  onDateSelect,
  value,
}: {
  onDateSelect: (date: Date) => void;
  value: string;
}) {
  const [month, setMonth] = useState(() => {
    const parsed = parseDateToObject(value);
    return parsed || new Date();
  });

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  // Monday-start: Sunday(0) → 6, Monday(1) → 0, Tuesday(2) → 1, etc.
  const rawFirstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month.getMonth() === today.getMonth() &&
    month.getFullYear() === today.getFullYear();

  const isSelected = (day: number) => {
    const parsed = parseDateToObject(value);
    if (!parsed) return false;
    return (
      day === parsed.getDate() &&
      month.getMonth() === parsed.getMonth() &&
      month.getFullYear() === parsed.getFullYear()
    );
  };

  return (
    <div className="w-64">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
          className="px-2 py-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg transition-colors"
        >
          ◀
        </button>
        <h3 className="text-sm font-semibold text-github-fg">{monthName}</h3>
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
          className="px-2 py-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg transition-colors"
        >
          ▶
        </button>
      </div>

      {/* Monday-start headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-github-dim">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (day) onDateSelect(new Date(month.getFullYear(), month.getMonth(), day));
            }}
            disabled={!day}
            className={`aspect-square text-xs font-semibold rounded transition-colors ${
              !day
                ? "text-github-border cursor-default"
                : isSelected(day)
                ? "bg-github-blue text-white hover:bg-github-blue/80"
                : isToday(day)
                ? "bg-github-blue/20 text-github-blue hover:bg-github-blue/30"
                : "text-github-fg hover:bg-github-border/50 cursor-pointer"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <button
        onClick={() => onDateSelect(new Date())}
        className="w-full mt-3 py-1.5 text-xs font-semibold text-github-blue hover:bg-github-blue/10 rounded transition-colors"
      >
        Today
      </button>
    </div>
  );
}

// Local helper — parses dd/mm/yyyy or yyyy-mm-dd for the calendar
function parseDateToObject(str: string): Date | null {
  if (!str) return null;
  // ISO: 2026-06-03
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // dd/mm/yyyy
  const parts = str.split("/");
  if (parts.length === 3) {
    const d = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    let y = parseInt(parts[2]);
    if (y < 100 && parts[2].length === 2) y += 2000;
    const date = new Date(y, m, d);
    if (date.getDate() === d && date.getMonth() === m && date.getFullYear() === y) {
      return date;
    }
  }
  return null;
}