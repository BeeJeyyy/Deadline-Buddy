"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getGroupReportData } from "@/app/dashboard/groups/report-actions";
import { Button } from "@/components/ui/button";

/** Builds the group's progress report as a PDF and downloads it. */
export function ReportButton({ groupId }: { groupId: string }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const result = await getGroupReportData(groupId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // The PDF library is only downloaded the first time someone asks for a report.
      const { downloadGroupReport } = await import("@/lib/report/group-report");
      await downloadGroupReport(result.data);
      toast.success("Report downloaded");
    } catch {
      toast.error("Couldn’t create the report. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={busy}
      title="Download a PDF progress report"
      aria-label="Download progress report"
      className="max-sm:size-10 max-sm:px-0"
    >
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      <span className="hidden sm:inline">{busy ? "Preparing…" : "Report"}</span>
    </Button>
  );
}