"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { presentNow, type PresentMember } from "./actions";

const REFRESH_MS = 30_000;

/** 004-AC5: who is checked in, refreshed every 30 s. */
export function PresentPanel({ initial }: { initial: PresentMember[] }) {
  const t = useTranslations("admin.dashboard");
  const format = useFormatter();
  const [present, setPresent] = useState(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        setPresent(await presentNow());
      } catch {
        // Keep the last list; the next tick retries.
      }
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <Card title={`${t("presentTitle")} (${present.length})`} tone="brand">
      {present.length === 0 ? (
        <p>{t("presentEmpty")}</p>
      ) : (
        <ul className="flex flex-wrap gap-3" data-testid="present-now">
          {present.map((p) => (
            <li
              key={p.memberId}
              className="rounded-[30px] border-2 border-ink bg-white px-4 py-1.5 shadow-brutal"
            >
              <span className="font-bold">{p.name}</span>{" "}
              <span className="text-sm">
                {t("since", { time: format.dateTime(new Date(p.checkIn), { timeStyle: "short" }) })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
