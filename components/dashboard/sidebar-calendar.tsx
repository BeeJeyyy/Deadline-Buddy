"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { getDueLabel, getTaskStatus } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import type { Group, Task, WeekStart } from "@/types";

interface SidebarCalendarProps {
  /** Tasks assigned to the signed-in user (open and done). */
  tasks: Task[];
  groups: Group[];
  nowIso: string;
  /** 0 = weeks start on Sunday (default), 1 = Monday. */
  weekStartsOn?: WeekStart;
  /** Called when a deadline link is tapped (the sidebar uses it to close its mobile drawer). */
  onNavigate?: () => void;
}

const WEEKDAYS_SUNDAY_FIRST = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAYS_MONDAY_FIRST = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_MS = 86_400_000;
const MAX_UPCOMING = 4;

const monthFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const longDayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const shortDayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const pad = (n: number) => String(n).padStart(2, "0");
/** Local-date key like "2026-11-17", the same shape as task.dueDate. */
const toKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromKey = (key: string) => new Date(`${key}T00:00:00`);

function daysFromToday(key: string, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((fromKey(key).getTime() - today) / DAY_MS);
}

/** "Today", "Tomorrow", "in 3 days", or the date for anything further out. */
function relativeLabel(task: Task, now: Date) {
  if (!task.dueDate) return "No deadline";
  const diff = daysFromToday(task.dueDate, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff <= 6) return `in ${diff} days`;
  return getDueLabel(task);
}

type DueKind = { label: string; className: string };

/** What kind of deadline a task is, as a short coloured label (used in the hover card). */
function getDueKind(task: Task, now: Date): DueKind {
  if (task.completed) return { label: "Done", className: "bg-muted text-muted-foreground" };

  const status = getTaskStatus(task, now);
  if (status === "overdue") return { label: "Overdue", className: "bg-destructive/15 text-destructive" };

  const diff = task.dueDate ? daysFromToday(task.dueDate, now) : 0;
  if (diff === 0) return { label: "Due today", className: "bg-primary text-primary-foreground" };
  if (diff === 1) return { label: "Due tomorrow", className: "bg-primary text-primary-foreground" };
  if (status === "due-soon") return { label: `Due in ${diff} days`, className: "bg-primary text-primary-foreground" };
  return { label: "Upcoming", className: "border text-muted-foreground" };
}

/** Overdue first, then open tasks, then finished ones. */
const byUrgency = (now: Date) => (a: Task, b: Task) => {
  const rank = (t: Task) => (t.completed ? 2 : getTaskStatus(t, now) === "overdue" ? 0 : 1);
  return rank(a) - rank(b);
};

/**
 * A compact month calendar for the sidebar. Days with your open deadlines are filled in,
 * late ones are tinted red, and clicking a day lists what is due. Underneath: your next deadlines.
 */
export function SidebarCalendar({ tasks, groups, nowIso, weekStartsOn = 0, onNavigate }: SidebarCalendarProps) {
  const now = useNow(nowIso);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hover, setHover] = useState<{ key: string; rect: DOMRect } | null>(null);

  const groupNames = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups]);
  const todayKey = toKey(now);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      map.set(task.dueDate, [...(map.get(task.dueDate) ?? []), task]);
    }
    return map;
  }, [tasks]);

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed && t.dueDate)
        .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0)),
    [tasks],
  );

  const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  // Always 6 weeks, so the calendar doesn't change height from month to month.
  const leadingDays = (month.getDay() - weekStartsOn + 7) % 7;
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - leadingDays);
  const weekdays = weekStartsOn === 1 ? WEEKDAYS_MONDAY_FIRST : WEEKDAYS_SUNDAY_FIRST;
  const days = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return { date, key: toKey(date), inMonth: date.getMonth() === month.getMonth() };
  });

  const selectedTasks = selectedKey
    ? [...(tasksByDay.get(selectedKey) ?? [])].sort((a, b) => Number(a.completed) - Number(b.completed))
    : [];
  const shownUpcoming = upcoming.slice(0, MAX_UPCOMING);
  const hiddenCount = upcoming.length - shownUpcoming.length;

  const goToToday = () => {
    setMonthOffset(0);
    setSelectedKey(null);
    setHover(null);
  };
  const changeMonth = (delta: number) => {
    setMonthOffset((o) => o + delta);
    setHover(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" aria-live="polite">
          {monthFormat.format(month)}
        </p>
        <div className="flex items-center gap-0.5">
          {(monthOffset !== 0 || selectedKey) && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={goToToday}>
              Today
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 pb-1 text-center text-[11px] font-medium text-muted-foreground">
          {weekdays.map((day, index) => (
            <span key={index}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map(({ date, key, inMonth }) => {
            const dayTasks = tasksByDay.get(key) ?? [];
            const open = dayTasks.filter((t) => !t.completed);
            const overdue = open.some((t) => getTaskStatus(t, now) === "overdue");
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const label =
              longDayFormat.format(date) +
              (open.length ? `, ${open.length} ${open.length === 1 ? "task" : "tasks"} due` : "");

            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                onClick={() => setSelectedKey(isSelected ? null : key)}
                onMouseEnter={dayTasks.length ? (e) => setHover({ key, rect: e.currentTarget.getBoundingClientRect() }) : undefined}
                onFocus={dayTasks.length ? (e) => setHover({ key, rect: e.currentTarget.getBoundingClientRect() }) : undefined}
                onMouseLeave={() => setHover(null)}
                onBlur={() => setHover(null)}
                className={cn(
                  "relative flex h-9 w-full items-center justify-center rounded-lg text-xs transition-colors lg:h-8",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !inMonth && "text-muted-foreground/40",
                  open.length === 0 && "hover:bg-muted",
                  open.length > 0 &&
                    !overdue &&
                    "bg-primary font-semibold text-primary-foreground hover:bg-primary/85",
                  overdue && "bg-destructive/15 font-semibold text-destructive hover:bg-destructive/25",
                  isToday && open.length === 0 && "font-bold ring-1 ring-foreground/50",
                  isToday && open.length > 0 && "ring-2 ring-foreground/30 ring-offset-1 ring-offset-sidebar",
                  isSelected && "ring-2 ring-ring ring-offset-1 ring-offset-sidebar",
                )}
              >
                {date.getDate()}
                {open.length > 1 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-background text-[9px] font-bold text-foreground ring-1 ring-border">
                    {open.length}
                  </span>
                )}
                {open.length === 0 && dayTasks.length > 0 && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-muted-foreground" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-muted-foreground" aria-label="Calendar legend">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-primary" aria-hidden="true" /> Due
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-destructive/40" aria-hidden="true" /> Overdue
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden="true" /> Done
        </li>
      </ul>

      <div className="space-y-1.5">
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {selectedKey ? shortDayFormat.format(fromKey(selectedKey)) : "Coming up"}
        </p>

        {selectedKey ? (
          selectedTasks.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">Nothing due on this day.</p>
          ) : (
            <ul className="space-y-0.5">
              {selectedTasks.map((task) => (
                <DeadlineItem key={task.id} task={task} groupName={groupNames.get(task.groupId)} now={now} onNavigate={onNavigate} />
              ))}
            </ul>
          )
        ) : shownUpcoming.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">You’re all caught up. No deadlines ahead.</p>
        ) : (
          <>
            <ul className="space-y-0.5">
              {shownUpcoming.map((task) => (
                <DeadlineItem key={task.id} task={task} groupName={groupNames.get(task.groupId)} now={now} onNavigate={onNavigate} />
              ))}
            </ul>
            {hiddenCount > 0 && (
              <Link
                href="/dashboard/tasks"
                onClick={onNavigate}
                className="block px-1 pt-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                +{hiddenCount} more in My tasks
              </Link>
            )}
          </>
        )}
      </div>

      {hover && (
        <DayHoverCard
          rect={hover.rect}
          dateKey={hover.key}
          tasks={[...(tasksByDay.get(hover.key) ?? [])].sort(byUrgency(now))}
          groupNames={groupNames}
          now={now}
        />
      )}
    </div>
  );
}

const HOVER_CARD_WIDTH = 232;
const HOVER_CARD_TASKS = 5;

/**
 * Shows what is due on a day while you hover (or keyboard-focus) it. It is drawn in a portal with
 * fixed positioning so the sidebar's edges can't clip it.
 */
function DayHoverCard({
  rect,
  dateKey,
  tasks,
  groupNames,
  now,
}: {
  rect: DOMRect;
  dateKey: string;
  tasks: Task[];
  groupNames: Map<string, string>;
  now: Date;
}) {
  const left = Math.min(Math.max(rect.left + rect.width / 2 - HOVER_CARD_WIDTH / 2, 8), window.innerWidth - HOVER_CARD_WIDTH - 8);
  // Prefer showing above the day; flip below when it's too close to the top of the window.
  const above = rect.top > 220;
  const position = above
    ? { bottom: window.innerHeight - rect.top + 6 }
    : { top: rect.bottom + 6 };
  const shown = tasks.slice(0, HOVER_CARD_TASKS);
  const hidden = tasks.length - shown.length;

  return createPortal(
    <div
      role="tooltip"
      style={{ left, width: HOVER_CARD_WIDTH, ...position }}
      className="pointer-events-none fixed z-50 space-y-2 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg"
    >
      <p className="text-xs font-semibold">{longDayFormat.format(fromKey(dateKey))}</p>
      <ul className="space-y-2">
        {shown.map((task) => {
          const kind = getDueKind(task, now);
          return (
            <li key={task.id} className="space-y-0.5">
              <span className={cn("inline-block rounded-full px-1.5 py-px text-[10px] font-semibold", kind.className)}>
                {kind.label}
              </span>
              <p className={cn("text-xs font-medium leading-snug", task.completed && "text-muted-foreground line-through")}>
                {task.title}
              </p>
              <p className="text-[11px] text-muted-foreground">{groupNames.get(task.groupId) ?? "Group"}</p>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && <p className="text-[11px] text-muted-foreground">+{hidden} more</p>}
    </div>,
    document.body,
  );
}

function DeadlineItem({
  task,
  groupName,
  now,
  onNavigate,
}: {
  task: Task;
  groupName?: string;
  now: Date;
  onNavigate?: () => void;
}) {
  const overdue = getTaskStatus(task, now) === "overdue";

  return (
    <li>
      <Link
        href={`/dashboard/groups/${task.groupId}`}
        onClick={onNavigate}
        className="block rounded-lg px-2 py-2 lg:py-1.5 transition-colors hover:bg-muted"
      >
        <p className={cn("truncate text-sm font-medium", task.completed && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {groupName ?? "Group"} ·{" "}
          <span className={cn(overdue && "font-medium text-destructive")}>
            {overdue ? `Overdue · ${getDueLabel(task)}` : relativeLabel(task, now)}
          </span>
        </p>
      </Link>
    </li>
  );
}