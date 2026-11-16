import type { jsPDF } from "jspdf";

import type { ReportData, ReportMember, ReportTask } from "./types";

type Rgb = [number, number, number];

const INK: Rgb = [20, 24, 45];
const ACCENT: Rgb = [79, 70, 229];
const ACCENT_SOFT: Rgb = [238, 237, 252];
const MUTED: Rgb = [107, 114, 128];
const LINE: Rgb = [226, 228, 232];
const SOFT: Rgb = [246, 247, 250];
const WHITE: Rgb = [255, 255, 255];
const RED: Rgb = [180, 35, 24];
const GREEN: Rgb = [21, 128, 61];

const MARGIN = 14;
const DAY_MS = 86_400_000;

const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const shortDayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** The built-in PDF fonts only cover Latin-1, so swap fancy punctuation and drop anything else. */
function safe(text: string): string {
  return text
    .replace(/[\u202F\u00A0]/g, " ")
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•·]/g, "-")
    .replace(/[^\x20-\x7E\u00A1-\u00FF]/g, "")
    .trim();
}

const fromDay = (day: string) => new Date(`${day}T00:00:00`);
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const formatDay = (day: string | null) => (day ? safe(dayFormat.format(fromDay(day))) : "-");
const formatDate = (iso: string) => safe(dayFormat.format(new Date(iso)));
const formatStamp = (iso: string) => safe(`${dayFormat.format(new Date(iso))}, ${timeFormat.format(new Date(iso))}`);
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "group";
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const STATUS_LABEL = { todo: "To do", in_progress: "In progress", done: "Done" } as const;
const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High" } as const;

/** How a finished task compares with its deadline. `days` is negative when finished early. */
function getResult(task: ReportTask): { text: string; late: boolean; measured: boolean; days: number } {
  if (!task.completedAt) return { text: "Date not recorded", late: false, measured: false, days: 0 };
  if (!task.dueDate) return { text: "No deadline", late: false, measured: false, days: 0 };

  const days = Math.round((startOfDay(new Date(task.completedAt)).getTime() - fromDay(task.dueDate).getTime()) / DAY_MS);
  if (days < 0) return { text: `Early by ${-days} ${-days === 1 ? "day" : "days"}`, late: false, measured: true, days };
  if (days === 0) return { text: "On time", late: false, measured: true, days };
  return { text: `Late by ${days} ${days === 1 ? "day" : "days"}`, late: true, measured: true, days };
}

/** Whole days from creation to completion (0 = same day). */
function daysToFinish(task: ReportTask): number | null {
  if (!task.completedAt) return null;
  const diff = startOfDay(new Date(task.completedAt)).getTime() - startOfDay(new Date(task.createdAt)).getTime();
  return Math.max(0, Math.round(diff / DAY_MS));
}

const isOverdue = (task: ReportTask, today: Date) =>
  task.status !== "done" && task.dueDate !== null && fromDay(task.dueDate).getTime() < today.getTime();

/** Monday of the week that contains `date`. */
function weekStart(date: Date): Date {
  const d = startOfDay(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

interface MemberStats {
  id: string | null;
  name: string;
  assigned: number;
  assignedDone: number;
  open: ReportTask[];
  overdue: number;
  /** Tasks this person finished (falls back to the assignee when nobody was recorded). */
  credited: ReportTask[];
  onTime: number;
  late: number;
  avgDays: number | null;
  share: number;
}

/** Builds the group progress and performance report as a PDF document (A4, portrait). */
export async function buildGroupReport(data: ReportData, now = new Date()) {
  const [{ jsPDF: PDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc: jsPDF = new PDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const today = startOfDay(now);

  const membersById = new Map(data.members.map((m) => [m.id, m]));
  const nameOf = (id: string | null) => (id ? safe(membersById.get(id)?.name ?? "Former member") : "Unassigned");

  // ── Numbers used throughout the report ─────────────────────────────
  const done = data.tasks.filter((t) => t.status === "done");
  const inProgress = data.tasks.filter((t) => t.status === "in_progress");
  const todo = data.tasks.filter((t) => t.status === "todo");
  const open = data.tasks.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => isOverdue(t, today));
  const percent = pct(done.length, data.tasks.length);

  const measured = done.filter((t) => getResult(t).measured);
  const onTimeCount = measured.filter((t) => !getResult(t).late).length;
  const lateCount = measured.length - onTimeCount;
  const onTimeRate = pct(onTimeCount, measured.length);

  const creditedId = (t: ReportTask) => t.completedById ?? t.assigneeId;

  const buildStats = (member: ReportMember | null, bucketName?: string): MemberStats => {
    const id = member?.id ?? null;
    const mine = id ? data.tasks.filter((t) => t.assigneeId === id) : data.tasks.filter((t) => !t.assigneeId);
    const credited = id
      ? done.filter((t) => creditedId(t) === id)
      : done.filter((t) => !creditedId(t) || !membersById.has(creditedId(t)!));
    const results = credited.map(getResult).filter((r) => r.measured);
    const durations = credited.map(daysToFinish).filter((d): d is number => d !== null);
    return {
      id,
      name: member ? safe(member.name) : (bucketName ?? "Unassigned"),
      assigned: mine.length,
      assignedDone: mine.filter((t) => t.status === "done").length,
      open: mine.filter((t) => t.status !== "done"),
      overdue: mine.filter((t) => isOverdue(t, today)).length,
      credited,
      onTime: results.filter((r) => !r.late).length,
      late: results.filter((r) => r.late).length,
      avgDays: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
      share: pct(credited.length, done.length),
    };
  };

  const stats: MemberStats[] = data.members.map((m) => buildStats(m));
  // Work nobody can be credited to (no assignee, or a member who has since left) still has to add up.
  const leftover = buildStats(null, "Unassigned / former members");
  if (leftover.assigned > 0 || leftover.credited.length > 0) stats.push(leftover);

  const dated = data.tasks.map((t) => new Date(t.createdAt).getTime()).filter((n) => !Number.isNaN(n));
  const periodStart = dated.length ? new Date(Math.min(...dated)) : now;

  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const heading = (text: string, note?: string) => {
    ensureSpace(24);
    doc.setFillColor(...ACCENT);
    doc.rect(MARGIN, y - 4, 1.4, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(text, MARGIN + 4, y);
    if (note) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(note, pageWidth - MARGIN, y, { align: "right" });
    }
    y += 5;
  };

  const emptyNote = (text: string) => {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(text, MARGIN, y + 4);
    y += 12;
  };

  const tableStyle = {
    theme: "plain" as const,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 2.6, bottom: 2.6, left: 2.5, right: 2.5 },
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0,
    },
    headStyles: { fillColor: INK, textColor: WHITE, fontStyle: "bold" as const, fontSize: 8 },
    alternateRowStyles: { fillColor: SOFT },
  };
  const afterTable = (gap = 11) => {
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? y) + gap;
  };

  // ── Cover band ─────────────────────────────────────────────────────
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageWidth, 52, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 52, pageWidth, 1.6, "F");

  doc.setFillColor(...WHITE);
  doc.roundedRect(MARGIN, 11, 8, 8, 2, 2, "F");
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.8);
  doc.lines([[1.4, 1.6], [2.8, -3.4]], MARGIN + 2.1, 15.2, [1, 1], "S");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Deadline Buddy", MARGIN + 11, 16.6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 193, 215);
  doc.text("GROUP PROGRESS & PERFORMANCE REPORT", pageWidth - MARGIN, 16.6, { align: "right" });

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  const title = doc.splitTextToSize(safe(data.group.name) || "Untitled group", contentWidth)[0] as string;
  doc.text(title, MARGIN, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 193, 215);
  doc.text(
    `Report period: ${formatDate(periodStart.toISOString())} to ${formatDate(now.toISOString())}   |   ${data.members.length} ${
      data.members.length === 1 ? "member" : "members"
    }`,
    MARGIN,
    42,
  );
  doc.text(`Generated ${formatStamp(now.toISOString())} by ${safe(data.generatedBy) || "a member"}`, MARGIN, 47);

  // ── Summary cards ──────────────────────────────────────────────────
  const cards: { label: string; value: string; tone?: Rgb }[] = [
    { label: "Total tasks", value: String(data.tasks.length) },
    { label: "Completed", value: String(done.length), tone: GREEN },
    { label: "In progress", value: String(inProgress.length) },
    { label: "To do", value: String(todo.length) },
    { label: "Overdue", value: String(overdue.length), tone: overdue.length > 0 ? RED : undefined },
  ];
  const gap = 3;
  const cardWidth = (contentWidth - gap * (cards.length - 1)) / cards.length;
  y = 63;

  cards.forEach((card, index) => {
    const x = MARGIN + index * (cardWidth + gap);
    doc.setFillColor(...SOFT);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardWidth, 20, 2.5, 2.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...(card.tone ?? INK));
    doc.text(card.value, x + 4, y + 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(card.label, x + 4, y + 16);
  });
  y += 29;

  // ── Overall completion + on-time rate bars ─────────────────────────
  const bar = (label: string, value: string, share: number, color: Rgb) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(label, MARGIN, y);
    doc.text(value, pageWidth - MARGIN, y, { align: "right" });
    doc.setFillColor(...LINE);
    doc.roundedRect(MARGIN, y + 2.5, contentWidth, 3, 1.5, 1.5, "F");
    if (share > 0) {
      doc.setFillColor(...color);
      doc.roundedRect(MARGIN, y + 2.5, Math.max((contentWidth * share) / 100, 3), 3, 1.5, 1.5, "F");
    }
    y += 13;
  };
  bar("Overall completion", `${percent}%  (${done.length} of ${data.tasks.length})`, percent, ACCENT);
  bar(
    "On-time delivery",
    measured.length ? `${onTimeRate}%  (${onTimeCount} of ${measured.length} with deadlines)` : "No finished tasks with deadlines yet",
    onTimeRate,
    GREEN,
  );
  y += 3;

  // ── Summary of findings (written for whoever reads the report) ─────
  heading("Summary");
  const lines: string[] = [];
  lines.push(
    data.tasks.length === 0
      ? "No tasks have been created for this group yet."
      : `The group has completed ${done.length} of ${data.tasks.length} tasks (${percent}%). ${inProgress.length} ${
          inProgress.length === 1 ? "task is" : "tasks are"
        } in progress and ${todo.length} ${todo.length === 1 ? "has" : "have"} not been started.`,
  );
  if (measured.length > 0) {
    lines.push(
      `${onTimeCount} of ${measured.length} completed tasks with a deadline were finished on or before the due date (${onTimeRate}%)${
        lateCount > 0 ? `; ${lateCount} ${lateCount === 1 ? "was" : "were"} late` : ""
      }.`,
    );
  }
  if (overdue.length > 0) {
    lines.push(`${overdue.length} open ${overdue.length === 1 ? "task is" : "tasks are"} past ${overdue.length === 1 ? "its" : "their"} deadline.`);
  }
  const topCount = Math.max(0, ...stats.filter((s) => s.id).map((s) => s.credited.length));
  if (topCount > 0) {
    const leaders = stats.filter((s) => s.id && s.credited.length === topCount).map((s) => s.name);
    lines.push(
      `Most tasks completed: ${leaders.join(" and ")} (${topCount} ${topCount === 1 ? "task" : "tasks"}${
        leaders.length > 1 ? " each" : ""
      }).`,
    );
  }
  const idle = stats.filter((s) => s.id && s.credited.length === 0 && s.assigned === 0).length;
  if (idle > 0 && data.tasks.length > 0) {
    lines.push(`${idle} ${idle === 1 ? "member has" : "members have"} no tasks assigned or completed yet.`);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(safe(line), contentWidth - 5) as string[];
    ensureSpace(wrapped.length * 4.6 + 3);
    doc.setFillColor(...ACCENT);
    doc.circle(MARGIN + 1.2, y + 0.4, 0.7, "F");
    doc.text(wrapped, MARGIN + 5, y + 1.4);
    y += wrapped.length * 4.6 + 1.5;
  });
  y += 6;

  // ── Member performance table ───────────────────────────────────────
  heading("Member performance", "Done = tasks that member finished");
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [["Member", "Assigned", "Done", "Open", "Overdue", "On time", "Late", "Share of work", "Avg. days"]],
    body: stats.map((s) => [
      s.name,
      String(s.assigned),
      String(s.credited.length),
      String(s.open.length),
      String(s.overdue),
      String(s.onTime),
      String(s.late),
      "",
      s.avgDays === null ? "-" : s.avgDays.toFixed(1),
    ]),
    columnStyles: {
      0: { cellWidth: "auto", fontStyle: "bold" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 19, halign: "center" },
      5: { cellWidth: 17, halign: "center" },
      6: { cellWidth: 11, halign: "center" },
      7: { cellWidth: 30 },
      8: { cellWidth: 16, halign: "center" },
    },
    didParseCell: (hook) => {
      if (hook.section !== "body") return;
      const row = stats[hook.row.index]!;
      if (hook.column.index === 4 && row.overdue > 0) {
        hook.cell.styles.textColor = RED;
        hook.cell.styles.fontStyle = "bold";
      }
      if (hook.column.index === 6 && row.late > 0) hook.cell.styles.textColor = RED;
    },
    didDrawCell: (hook) => {
      if (hook.section !== "body" || hook.column.index !== 7) return;
      const row = stats[hook.row.index]!;
      const barX = hook.cell.x + 2.5;
      const barY = hook.cell.y + hook.cell.height / 2 - 1.2;
      const barWidth = hook.cell.width - 12;

      doc.setFillColor(...LINE);
      doc.roundedRect(barX, barY, barWidth, 2.4, 1.2, 1.2, "F");
      if (row.share > 0) {
        doc.setFillColor(...ACCENT);
        doc.roundedRect(barX, barY, Math.max((barWidth * row.share) / 100, 2.4), 2.4, 1.2, 1.2, "F");
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      doc.text(`${row.share}%`, hook.cell.x + hook.cell.width - 2.5, hook.cell.y + hook.cell.height / 2 + 1, { align: "right" });
    },
  });
  afterTable(5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.8);
  doc.setTextColor(...MUTED);
  const legend = doc.splitTextToSize(
    "Assigned = tasks given to the member. Share of work = that member's part of all completed tasks. On time / Late are counted only for finished tasks that have a deadline. Avg. days = average time from creating a task to finishing it.",
    contentWidth,
  ) as string[];
  doc.text(legend, MARGIN, y);
  y += legend.length * 3.6 + 9;

  // ── Weekly activity chart ──────────────────────────────────────────
  const stamps = done.filter((t) => t.completedAt).map((t) => new Date(t.completedAt!));
  if (stamps.length > 0) {
    const counts = new Map<number, number>();
    stamps.forEach((d) => {
      const key = weekStart(d).getTime();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const first = Math.min(...counts.keys());
    const last = weekStart(now).getTime() > Math.max(...counts.keys()) ? weekStart(now).getTime() : Math.max(...counts.keys());
    const weeks: { start: Date; count: number }[] = [];
    for (let t = first; t <= last; t += 7 * DAY_MS) {
      const start = new Date(t);
      weeks.push({ start, count: counts.get(weekStart(start).getTime()) ?? 0 });
    }
    const shown = weeks.slice(-10);
    const peak = Math.max(1, ...shown.map((w) => w.count));

    ensureSpace(50);
    heading("Weekly activity", "Tasks completed per week");
    const chartTop = y + 4;
    const chartHeight = 26;
    const slot = contentWidth / shown.length;
    const barWidth = Math.min(14, slot * 0.55);

    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, chartTop + chartHeight, pageWidth - MARGIN, chartTop + chartHeight);

    shown.forEach((week, i) => {
      const h = (week.count / peak) * (chartHeight - 6);
      const x = MARGIN + i * slot + (slot - barWidth) / 2;
      if (week.count > 0) {
        doc.setFillColor(...ACCENT);
        doc.roundedRect(x, chartTop + chartHeight - h, barWidth, h, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...INK);
        doc.text(String(week.count), x + barWidth / 2, chartTop + chartHeight - h - 1.5, { align: "center" });
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(safe(shortDayFormat.format(week.start)), x + barWidth / 2, chartTop + chartHeight + 4.5, { align: "center" });
    });
    doc.setFontSize(7.5);
    doc.text("Week starting (Monday)", pageWidth - MARGIN, chartTop + chartHeight + 9.5, { align: "right" });
    y = chartTop + chartHeight + 17;
  }

  // ── Individual breakdown ───────────────────────────────────────────
  heading("Individual breakdown", "Every task each member finished, with dates");
  stats.forEach((s) => {
    ensureSpace(34);

    // Name strip
    doc.setFillColor(...ACCENT_SOFT);
    doc.roundedRect(MARGIN, y, contentWidth, 11, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(s.name, MARGIN + 4, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const rate = s.assigned > 0 ? `${pct(s.assignedDone, s.assigned)}% of assigned tasks done` : "No tasks assigned";
    doc.text(
      `${s.credited.length} completed  |  ${s.open.length} open  |  ${rate}`,
      pageWidth - MARGIN - 4,
      y + 7,
      { align: "right" },
    );
    y += 13;

    if (s.credited.length === 0) {
      emptyNote("No completed tasks recorded yet.");
    } else {
      const rows = [...s.credited].sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""));
      autoTable(doc, {
        ...tableStyle,
        startY: y,
        head: [["Task", "Completed on", "Due", "Result", "Days taken"]],
        body: rows.map((task) => {
          const taken = daysToFinish(task);
          return [
            safe(task.title) || "(untitled)",
            task.completedAt ? formatStamp(task.completedAt) : "Not recorded",
            formatDay(task.dueDate),
            getResult(task).text,
            taken === null ? "-" : String(taken),
          ];
        }),
        columnStyles: {
          0: { cellWidth: "auto", fontStyle: "bold" },
          1: { cellWidth: 38 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20, halign: "center" },
        },
        didParseCell: (hook) => {
          if (hook.section !== "body" || hook.column.index !== 3) return;
          const result = getResult(rows[hook.row.index]!);
          if (result.late) {
            hook.cell.styles.textColor = RED;
            hook.cell.styles.fontStyle = "bold";
          } else if (result.measured) {
            hook.cell.styles.textColor = GREEN;
          }
        },
      });
      afterTable(4);
    }

    if (s.open.length > 0) {
      const text = `Still working on: ${s.open.map((t) => safe(t.title) || "(untitled)").join("; ")}`;
      const wrapped = doc.splitTextToSize(text, contentWidth) as string[];
      ensureSpace(wrapped.length * 3.8 + 4);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(wrapped, MARGIN, y + 2);
      y += wrapped.length * 3.8 + 2;
    }
    y += 8;
  });

  // ── Still open ─────────────────────────────────────────────────────
  const stillOpen = [...open].sort((a, b) => {
    const rank = (t: ReportTask) => (isOverdue(t, today) ? 0 : t.dueDate ? 1 : 2);
    return rank(a) - rank(b) || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
  });
  heading("Still open", `${stillOpen.length} to go${overdue.length ? `, ${overdue.length} overdue` : ""}`);
  if (stillOpen.length === 0) {
    emptyNote("Everything is done. Nice work!");
  } else {
    autoTable(doc, {
      ...tableStyle,
      startY: y,
      head: [["Task", "Assigned to", "Status", "Due", "Priority"]],
      body: stillOpen.map((task) => [
        safe(task.title) || "(untitled)",
        nameOf(task.assigneeId),
        STATUS_LABEL[task.status],
        isOverdue(task, today) ? `${formatDay(task.dueDate)} (overdue)` : formatDay(task.dueDate),
        PRIORITY_LABEL[task.priority],
      ]),
      columnStyles: {
        0: { cellWidth: "auto", fontStyle: "bold" },
        1: { cellWidth: 30 },
        2: { cellWidth: 24 },
        3: { cellWidth: 38 },
        4: { cellWidth: 20 },
      },
      didParseCell: (hook) => {
        if (hook.section === "body" && hook.column.index === 3 && isOverdue(stillOpen[hook.row.index]!, today)) {
          hook.cell.styles.textColor = RED;
          hook.cell.styles.fontStyle = "bold";
        }
      },
    });
    afterTable();
  }

  // ── Notes on how the numbers were produced ─────────────────────────
  const unrecorded = done.filter((t) => !t.completedAt).length;
  const notes = [
    "Completion dates and the person who finished a task are recorded automatically by Deadline Buddy the moment a task is moved to Done.",
    unrecorded > 0
      ? `${unrecorded} ${unrecorded === 1 ? "task was" : "tasks were"} finished before tracking started, so ${
          unrecorded === 1 ? "its" : "their"
        } date is shown as "Not recorded" and left out of on-time figures. Those tasks are credited to their assignee.`
      : "",
  ].filter(Boolean);
  ensureSpace(14 + notes.length * 9);
  heading("Notes");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  notes.forEach((note) => {
    const wrapped = doc.splitTextToSize(safe(note), contentWidth) as string[];
    doc.text(wrapped, MARGIN, y + 2);
    y += wrapped.length * 3.9 + 2;
  });

  // ── Footer on every page ───────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, pageHeight - 13, pageWidth - MARGIN, pageHeight - 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Deadline Buddy  |  ${safe(data.group.name)}  |  Generated ${formatDate(now.toISOString())}`, MARGIN, pageHeight - 8);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - MARGIN, pageHeight - 8, { align: "right" });
  }

  const filename = `${slug(data.group.name)}-progress-report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}.pdf`;
  return { doc, filename };
}

/** Builds the report and saves it through the browser's download. */
export async function downloadGroupReport(data: ReportData) {
  const { doc, filename } = await buildGroupReport(data);
  doc.save(filename);
}