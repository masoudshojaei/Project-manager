import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { isValidDateString } from "../dateUtils";

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
  const [inputValue, setInputValue] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validate and update if valid dd/mm/yyyy
    if (isValidDateString(newValue) || newValue === "") {
      onChange(newValue || undefined);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange(undefined);
  };

  const handleDateFromCalendar = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const formatted = `${dd}/${mm}/${yyyy}`;
    setInputValue(formatted);
    onChange(formatted);
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
            placeholder={placeholder}
            className="input-field text-sm py-2 pr-8"
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-github-dim hover:text-github-blue transition-colors"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
        {value && (
          <button
            onClick={handleClear}
            className="px-2 py-2 rounded-lg text-github-dim hover:text-github-red hover:bg-github-red/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Calendar Picker */}
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
    if (value) {
      const parts = value.split("/");
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1);
      }
    }
    return new Date();
  });

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

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

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
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
              if (day) {
                onDateSelect(new Date(month.getFullYear(), month.getMonth(), day));
              }
            }}
            disabled={!day}
            className={`aspect-square text-xs font-semibold rounded transition-colors ${
              day
                ? "text-github-fg hover:bg-github-blue/20 cursor-pointer"
                : "text-github-border cursor-default"
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
