import Link from "next/link";
import { Hammer } from "lucide-react";

/** Placeholder for routes scheduled in a later milestone, so no link in the UI dead-ends. */
export function ComingSoon({
  title,
  milestone,
  description,
}: {
  title: string;
  milestone: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Hammer className="size-7" aria-hidden />
      </span>
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">Coming in {milestone}</p>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted">{description}</p>
      <Link href="/">Back to the homepage</Link>
    </div>
  );
}
