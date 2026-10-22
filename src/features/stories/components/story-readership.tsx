"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RequestError } from "@/features/dashboard/components/request-error";
import { useStoryAnalytics } from "../hooks/use-story-analytics";
import {
  analyticsDaysSchema,
  type StoryAnalytics,
  type AnalyticsDays,
} from "../story-analytics.schema";

export function StoryReadership({
  storyId,
  title,
}: {
  storyId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<AnalyticsDays>(30);
  const query = useStoryAnalytics(storyId, days, open);
  const report = query.data;
  const story = report?.stories.find((item) => item.storyId === storyId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`Readership for ${title}`}
        >
          Readership
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto data-[state=open]:animate-none data-[state=closed]:animate-none sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Story readership</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor={`readership-period-${storyId}`}
            className="text-sm font-medium"
          >
            Readership period
          </label>
          <select
            id={`readership-period-${storyId}`}
            value={days}
            onChange={(event) => {
              const selected = analyticsDaysSchema.safeParse(
                Number(event.target.value),
              );
              if (selected.success) setDays(selected.data);
            }}
            className="h-10 rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        {query.isPending && (
          <p role="status" className="text-sm">
            Loading readership…
          </p>
        )}
        {query.isFetching && !query.isPending && (
          <p role="status" className="text-sm">
            Updating readership…
          </p>
        )}
        {query.error && (
          <RequestError
            error={query.error}
            retry={() => void query.refetch()}
          />
        )}
        {!query.error &&
          report &&
          (story ? (
            <>
              <p className="text-xs text-[#535d70]">
                {report.from.slice(0, 10)} – {report.to.slice(0, 10)} UTC
              </p>
              <ReadershipTotals story={story} />
              {story.opens === 0 && (
                <p className="text-sm text-[#535d70]">
                  No opens recorded in this period.
                </p>
              )}
              <p className="text-xs text-[#535d70]">
                {report.trackingStartedAt
                  ? `Tracking started: ${report.trackingStartedAt.slice(0, 10)} UTC. Historical readership before collection is unavailable.`
                  : "No tracking events recorded yet. Collection begins after release; historical readership is unavailable."}
              </p>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <caption className="px-3 py-2 text-left font-medium">
                    Daily readership (UTC)
                  </caption>
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="p-3">
                        Date
                      </th>
                      <th scope="col" className="p-3">
                        Opens
                      </th>
                      <th scope="col" className="p-3">
                        Engaged reads
                      </th>
                      <th scope="col" className="p-3">
                        Completions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {story.daily.map((day) => (
                      <tr key={day.date} className="border-t tabular-nums">
                        <th
                          scope="row"
                          className="whitespace-nowrap p-3 font-normal"
                        >
                          {day.date}
                        </th>
                        <td className="p-3">{day.opens}</td>
                        <td className="p-3">{day.engaged}</td>
                        <td className="p-3">{day.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p role="status" className="text-sm">
              Readership is unavailable for this story.
            </p>
          ))}
        <dl className="space-y-2 border-t pt-4 text-xs text-[#535d70]">
          <div>
            <dt className="font-semibold">Opens</dt>
            <dd>
              Recorded story-page visits. Refreshing counts as another open.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Engaged reads</dt>
            <dd>
              At least 30 seconds with the article visible in an active tab.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Completions</dt>
            <dd>An engaged read reaching 90% of the article.</dd>
          </div>
        </dl>
        <p className="text-xs text-[#535d70]">
          These are observed events, not unique people. Blocked or undelivered
          events are missing observations. Zero recorded events do not prove
          nobody read the story. Data is retained for 90 days.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function ReadershipTotals({ story }: { story: StoryAnalytics }) {
  return (
    <dl className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center">
      {[
        { label: "Opens", count: story.opens },
        { label: "Engaged reads", count: story.engaged },
        { label: "Completions", count: story.completed },
      ].map(({ label, count }) => (
        <div key={label}>
          <dt className="text-xs text-[#535d70]">{label}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-[#1d2b4f]">
            {count}
          </dd>
        </div>
      ))}
    </dl>
  );
}
