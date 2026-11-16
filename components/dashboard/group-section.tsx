"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { GroupSummary } from "@/types";
import { GroupCard } from "./group-card";

interface GroupsSectionProps {
  summaries: GroupSummary[];
  onToggleStar: (groupId: string) => void;
}

export function GroupsSection({ summaries, onToggleStar }: GroupsSectionProps) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? summaries.filter((s) => s.group.name.toLowerCase().includes(q)) : summaries;
  }, [summaries, query]);

  return (
    <section aria-labelledby="groups-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id="groups-heading" className="font-semibold">
          Your groups
        </h2>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search groups"
          aria-label="Search groups"
          className="max-w-56 rounded-lg"
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No groups match “{query}”.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((summary) => (
            <GroupCard key={summary.group.id} summary={summary} onToggleStar={onToggleStar} />
          ))}
        </div>
      )}
    </section>
  );
}