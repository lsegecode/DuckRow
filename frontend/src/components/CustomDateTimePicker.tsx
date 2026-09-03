/**
 * CustomDateTimePicker — Elegant date & time picker matching DuckRow's aesthetic.
 *
 * Features:
 * - Display format: dd/mm/aaaa HH:mm (Latin American / Spanish 24-hour standard)
 * - Custom dark theme calendar with month navigation and Spanish weekday headers (Lu-Do)
 * - Custom digital time selector (00-23 hours and 00-59 minutes) with quick minute chips
 * - Quick "Ahora" (Now) button and optional "Limpiar" button
 * - Supports `max` and `min` bounds (e.g. blocking future dates for resolved tickets)
 * - Emits standard `YYYY-MM-DDTHH:mm` string compatible with HTML5 and Django API
 */

import { useState, useEffect, useRef } from 'react';

interface CustomDateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm or ISO string or ''
  onChange: (val: string) => void;
  max?: string; // YYYY-MM-DDTHH:mm
  min?: string; // YYYY-MM-DDTHH:mm
  accentColor?: 'teal' | 'resolved';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export default function CustomDateTimePicker({
  value,
  onChange,
  max,
  min,
  accentColor = 'teal',
  placeholder = 'dd/mm/aaaa hh:mm',
  className = '',
  disabled = false,
}: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or fallback to now
  const parsedDate = (() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  })();

  // Calendar navigation state (month & year)
  const initialView = parsedDate || new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  // ── Date Helpers ─────────────────────────────────────────────────────────

  const formatDisplay = (d: Date | null): string => {
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  };

  const toInputString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  const maxDate = max ? new Date(max) : null;
  const minDate = min ? new Date(min) : null;

  const isDateDisabled = (year: number, month: number, day: number): boolean => {
    const checkStartOfDay = new Date(year, month, day, 0, 0, 0, 0);
    if (maxDate) {
      const maxEndOfDay = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59, 999);
      if (checkStartOfDay > maxEndOfDay) return true;
    }
    if (minDate) {
      const minStartOfDay = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), 0, 0, 0, 0);
      if (checkStartOfDay < minStartOfDay) return true;
    }
    return false;
  };

  // ── Month Navigation ──────────────────────────────────────────────────────

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // ── Date & Time Selections ────────────────────────────────────────────────

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(viewYear, viewMonth, day)) return;

    const base = parsedDate ? new Date(parsedDate) : new Date();
    base.setFullYear(viewYear);
    base.setMonth(viewMonth);
    base.setDate(day);

    // If clamping by maxDate
    if (maxDate && base > maxDate) {
      base.setHours(maxDate.getHours(), maxDate.getMinutes());
    }

    onChange(toInputString(base));
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const base = parsedDate ? new Date(parsedDate) : new Date(viewYear, viewMonth, 1);
    base.setHours(Math.max(0, Math.min(23, hours)));
    base.setMinutes(Math.max(0, Math.min(59, minutes)));

    if (maxDate && base > maxDate) {
      base.setTime(maxDate.getTime());
    }

    onChange(toInputString(base));
  };

  const handleSetNow = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const now = new Date();
    const target = maxDate && now > maxDate ? maxDate : now;
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    onChange(toInputString(target));
  };

  // ── Grid Computation ──────────────────────────────────────────────────────

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 0 = Monday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const isToday = (day: number): boolean => {
    const now = new Date();
    return (
      now.getDate() === day &&
      now.getMonth() === viewMonth &&
      now.getFullYear() === viewYear
    );
  };

  const isSelected = (day: number): boolean => {
    if (!parsedDate) return false;
    return (
      parsedDate.getDate() === day &&
      parsedDate.getMonth() === viewMonth &&
      parsedDate.getFullYear() === viewYear
    );
  };

  // Colors
  const isResolved = accentColor === 'resolved';
  const accentBorderClass = isResolved
    ? 'border-status-resolved/40 focus-within:border-status-resolved focus-within:ring-1 focus-within:ring-status-resolved/30'
    : 'border-teal/50 focus-within:border-teal focus-within:ring-1 focus-within:ring-teal/30';
  const activeDayBg = isResolved ? 'bg-status-resolved text-obsidian font-bold shadow-md shadow-status-resolved/30' : 'bg-teal text-white font-bold shadow-md shadow-teal/30';
  const accentText = isResolved ? 'text-status-resolved' : 'text-teal-glow';

  const currentHours = parsedDate ? parsedDate.getHours() : new Date().getHours();
  const currentMins = parsedDate ? parsedDate.getMinutes() : new Date().getMinutes();

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* ── Input Trigger Bar ── */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-obsidian border rounded-xl transition-all cursor-pointer ${accentBorderClass} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-border-light'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`${accentText} shrink-0`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div className="flex flex-col">
            <span className={`text-sm font-medium tracking-wide ${value ? 'text-text-primary' : 'text-text-muted'}`}>
              {parsedDate ? formatDisplay(parsedDate) : placeholder}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSetNow}
            title="Establecer fecha y hora actual"
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
              isResolved
                ? 'bg-status-resolved/15 text-status-resolved hover:bg-status-resolved/25'
                : 'bg-teal/20 text-teal-glow hover:bg-teal/30'
            }`}
          >
            Ahora
          </button>
          <span className={`text-xs text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {/* ── Calendar & Clock Popover Card ── */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 sm:right-auto sm:w-[360px] mt-2 p-4 bg-obsidian-light/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] animate-fade-in"
          style={{ top: '100%' }}
        >
          {/* Header: Month & Year Navigator */}
          <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-border/60">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors text-sm cursor-pointer"
            >
              ‹
            </button>
            <div className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
              <span>{MONTH_NAMES_ES[viewMonth]}</span>
              <span className="text-text-secondary font-medium">{viewYear}</span>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors text-sm cursor-pointer"
            >
              ›
            </button>
          </div>

          {/* Weekday headers: Lu Ma Mi Ju Vi Sá Do */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAYS_ES.map((day) => (
              <span key={day} className="text-[11px] font-semibold text-text-muted uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Previous month padding days */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <span
                key={`prev-${i}`}
                className="h-8 flex items-center justify-center text-xs text-text-muted/30 select-none"
              >
                {daysInPrevMonth - firstDayWeekday + i + 1}
              </span>
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabledDay = isDateDisabled(viewYear, viewMonth, day);
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs transition-all cursor-pointer ${
                    selected
                      ? activeDayBg
                      : today
                      ? 'border border-teal-glow text-teal-glow font-semibold hover:bg-surface-hover'
                      : disabledDay
                      ? 'text-text-muted/30 cursor-not-allowed'
                      : 'text-text-primary hover:bg-surface-hover font-medium'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* ── Time Selector (24-Hour Format: HH:mm) ── */}
          <div className="mt-4 pt-3.5 border-t border-border/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Hora (24h)</span>
              </div>
              <span className={`text-xs font-mono font-bold ${accentText}`}>
                {String(currentHours).padStart(2, '0')}:{String(currentMins).padStart(2, '0')} hs
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Hour input / select */}
              <div className="flex-1 flex items-center bg-obsidian border border-border rounded-xl px-2 py-1.5">
                <span className="text-xs text-text-muted mr-1.5 font-mono">H:</span>
                <select
                  value={currentHours}
                  onChange={(e) => handleTimeChange(Number(e.target.value), currentMins)}
                  className="bg-transparent text-text-primary text-sm font-semibold outline-none cursor-pointer w-full font-mono"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={`h-${h}`} value={h} className="bg-obsidian text-text-primary">
                      {String(h).padStart(2, '0')} hs
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-text-muted font-bold font-mono">:</span>

              {/* Minute input / select */}
              <div className="flex-1 flex items-center bg-obsidian border border-border rounded-xl px-2 py-1.5">
                <span className="text-xs text-text-muted mr-1.5 font-mono">M:</span>
                <select
                  value={currentMins}
                  onChange={(e) => handleTimeChange(currentHours, Number(e.target.value))}
                  className="bg-transparent text-text-primary text-sm font-semibold outline-none cursor-pointer w-full font-mono"
                >
                  {Array.from({ length: 60 }).map((_, m) => (
                    <option key={`m-${m}`} value={m} className="bg-obsidian text-text-primary">
                      {String(m).padStart(2, '0')} min
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick minute chips */}
            <div className="flex items-center justify-between gap-1 mt-2.5">
              {[0, 15, 30, 45].map((presetMin) => (
                <button
                  key={`preset-${presetMin}`}
                  type="button"
                  onClick={() => handleTimeChange(currentHours, presetMin)}
                  className={`flex-1 py-1 text-[11px] font-mono rounded-lg border transition-all cursor-pointer ${
                    currentMins === presetMin
                      ? isResolved
                        ? 'bg-status-resolved/20 border-status-resolved/40 text-status-resolved font-bold'
                        : 'bg-teal/20 border-teal/40 text-teal-glow font-bold'
                      : 'bg-surface/50 border-border text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  :{String(presetMin).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSetNow}
              className="text-xs font-semibold text-text-secondary hover:text-teal-glow transition-colors cursor-pointer"
            >
              📅 Seleccionar Ahora
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
                isResolved
                  ? 'bg-status-resolved hover:bg-status-resolved/80 text-obsidian'
                  : 'bg-teal hover:bg-teal-light text-white'
              }`}
            >
              Listo ✔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
