"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import { LanguageFlags } from "@/components/language-flags";

export function LanguageSwitcher() {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <LanguageFlags
      current={current}
      disabled={pending}
      onSelect={(locale) =>
        startTransition(async () => {
          await setLocale(locale);
          router.refresh();
        })
      }
    />
  );
}
