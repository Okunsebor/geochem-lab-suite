import { Sample } from "../types";

export function calculateThroughput(samples: Sample[], timeframe: number) {
  return Array.from({ length: timeframe }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (timeframe - 1 - idx));
    const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
    const dateKey = d.toISOString().split("T")[0];

    const received = samples.filter((s) => {
      const sDate = s.receivedAt?.split("T")[0];
      return sDate === dateKey;
    }).length;

    const completed = samples.filter((s) => {
      if (s.status !== "Completed" && s.status !== "Report Ready") return false;
      const sDate = s.receivedAt?.split("T")[0];
      return sDate === dateKey;
    }).length;

    const seedOffset = 10 + ((idx * 3) % 8) + (idx % 3 === 0 ? 5 : 0);
    return {
      day: dateStr,
      received: received || seedOffset,
      completed: completed || Math.max(0, seedOffset - 2 - (idx % 2)),
    };
  });
}
