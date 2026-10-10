"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { LanguageFlags } from "@/components/language-flags";
import { Button, Card, inputClass } from "@/components/ui";
import {
  checkOut,
  refreshPresent,
  setKioskLocale,
  submitCode,
  type KioskResult,
  type Present,
} from "./actions";

type Feedback = { tone: "in" | "out" | "error"; text: string } | null;

const REFRESH_MS = 30_000;
const FEEDBACK_MS = 4_000;
const TICK_MS = 15_000;

// Current time rounded to the tick, so snapshots are stable; null during server render.
function subscribeClock(onTick: () => void) {
  const id = setInterval(onTick, TICK_MS);
  return () => clearInterval(id);
}
const clockSnapshot = () => Math.floor(Date.now() / TICK_MS) * TICK_MS;
const useNow = () => useSyncExternalStore(subscribeClock, clockSnapshot, () => null);

export function KioskClient({ initialPresent }: { initialPresent: Present[] }) {
  const t = useTranslations("kiosk");
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [present, setPresent] = useState(initialPresent);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirming, setConfirming] = useState<Present | null>(null);
  const [filter, setFilter] = useState("");
  const now = useNow();
  const [pending, startTransition] = useTransition();

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  // The present grid refreshes periodically (001-AC8).
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const latest = await refreshPresent();
        if (latest) setPresent(latest);
      } catch {
        // Offline: keep the last known list; the next poll retries.
      }
    }, REFRESH_MS);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  function apply(result: KioskResult, clearCode: boolean) {
    if (result.present) setPresent(result.present);
    if (result.ok) {
      if (result.action !== "noop") setFeedback({ tone: result.action, text: result.message });
      if (clearCode) setCode("");
    } else if (result.error === "UNAUTHORIZED") {
      router.refresh();
    } else {
      setFeedback({ tone: "error", text: t("notFound") });
    }
  }

  function run(action: () => Promise<KioskResult>, clearCode: boolean) {
    startTransition(async () => {
      try {
        apply(await action(), clearCode);
      } catch {
        // 001-AC9: keep the typed code so the person can retry.
        setFeedback({ tone: "error", text: t("offline") });
      }
      focusInput();
    });
  }

  const visible = filter
    ? present.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    : present;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 bg-navy px-4 py-2 text-white">
        <p className="text-2xl font-bold tabular-nums" suppressHydrationWarning>
          {now !== null &&
            new Intl.DateTimeFormat(locale, {
              weekday: "long",
              hour: "2-digit",
              minute: "2-digit",
            }).format(now)}
        </p>
        <div className="flex items-center gap-3">
          <LanguageFlags
            current={locale}
            disabled={pending}
            onSelect={(l) =>
              startTransition(async () => {
                await setKioskLocale(l);
                router.refresh();
              })
            }
          />
          <Image
            src="/logo.avif"
            alt="Team 1156"
            width={1200}
            height={350}
            priority
            className="h-12 w-auto"
          />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pt-16 pb-10 text-center">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (code.length === 6) run(() => submitCode(code), true);
          }}
        >
          <div className="kiosk-code-box" data-label={t("codeLabel")}>
            <div className="kiosk-glow" />
            <input
              ref={inputRef}
              className="kiosk-code-input"
              name="code"
              aria-label={t("codeLabel")}
              placeholder={t("placeholder")}
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          <button
            type="submit"
            className="kiosk-pixel-button"
            disabled={pending || code.length !== 6}
          >
            <div>
              <div>
                <div>{t("submit")}</div>
              </div>
            </div>
          </button>
        </form>

        <div className="mt-10 min-h-20" aria-live="polite">
          {feedback && (
            <p
              role={feedback.tone === "error" ? "alert" : "status"}
              className={`rounded-brutal border-4 border-ink px-6 py-4 text-3xl font-black shadow-brutal ${
                feedback.tone === "in"
                  ? "bg-[#c8f5df]"
                  : feedback.tone === "out"
                    ? "bg-brand"
                    : "bg-[#ffd6d2]"
              }`}
            >
              {feedback.text}
            </p>
          )}
        </div>

        <h2 className="mt-6 text-2xl font-black">{t("presentTitle")}</h2>
        {present.length > 20 && (
          <input
            type="search"
            aria-label={t("filter")}
            placeholder={t("filter")}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className={`${inputClass} mt-4 max-w-xs`}
          />
        )}
        {present.length === 0 ? (
          <p className="mt-6 text-lg">{t("nobody")}</p>
        ) : (
          <ul className="mx-auto mt-10 flex w-[90%] flex-wrap justify-center gap-10">
            {visible.map((p, i) => (
              <li
                key={p.memberId}
                className="animate-float"
                style={{ animationDelay: `${(i * 0.7) % 4}s` }}
              >
                <button
                  type="button"
                  data-testid="present-bubble"
                  onClick={() => setConfirming(p)}
                  className="flex cursor-pointer flex-col rounded-[30px] border-2 border-ink bg-white px-8 py-2.5 text-lg shadow-bubble transition-transform hover:scale-125"
                >
                  <span className="font-bold">{p.name}</span>
                  {now !== null && (
                    <span className="text-sm">
                      {(() => {
                        const minutes = Math.max(
                          0,
                          Math.floor((now - new Date(p.checkIn).getTime()) / 60_000),
                        );
                        return t("elapsed", {
                          hours: Math.floor(minutes / 60),
                          minutes: minutes % 60,
                        });
                      })()}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onKeyDown={(event) => event.key === "Escape" && setConfirming(null)}
        >
          <Card tone="brand" className="w-full max-w-md text-center">
            <h2 id="confirm-title" className="mb-3 text-2xl font-black">
              {t("confirmTitle")}
            </h2>
            <p className="mb-6 text-xl">{t("confirmBody", { name: confirming.name })}</p>
            <div className="flex justify-center gap-4">
              <Button type="button" variant="secondary" onClick={() => setConfirming(null)}>
                {t("cancel")}
              </Button>
              <Button
                type="button"
                autoFocus
                disabled={pending}
                onClick={() => {
                  const memberId = confirming.memberId;
                  setConfirming(null);
                  run(() => checkOut(memberId), false);
                }}
              >
                {t("confirm")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
