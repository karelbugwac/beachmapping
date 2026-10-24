/**
 * Client-Side Real-Time Tide Interpolation Helper
 * Uses cosine interpolation between cached tide extremes (Stormglass).
 */

export interface TideExtreme {
  time: string; // ISO 8601 string
  height: number; // in meters
  type: 'high' | 'low';
}

export interface CurrentTideState {
  currentHeight: number; // in meters
  status: 'Rising' | 'Falling' | 'High Tide Peak' | 'Low Tide Slack';
  previousExtreme: TideExtreme;
  nextExtreme: TideExtreme;
  percentageBetween: number; // 0 to 100
}

/**
 * Calculates current real-time tide height using cosine interpolation.
 * Formula: h(t) = h0 + (h1 - h0) * (1 - cos(π * (now - t0) / (t1 - t0))) / 2
 */
export function calculateCurrentTide(
  extremes: TideExtreme[],
  targetDate: Date = new Date()
): CurrentTideState | null {
  if (!extremes || extremes.length < 2) {
    return null;
  }

  // Sort chronologically
  const sorted = [...extremes].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const nowMs = targetDate.getTime();

  // Find previous extreme (t0) and next extreme (t1)
  let prevIdx = -1;
  let nextIdx = -1;

  for (let i = 0; i < sorted.length - 1; i++) {
    const t0 = new Date(sorted[i].time).getTime();
    const t1 = new Date(sorted[i + 1].time).getTime();

    if (nowMs >= t0 && nowMs <= t1) {
      prevIdx = i;
      nextIdx = i + 1;
      break;
    }
  }

  // If now is before the first or after the last, pick the closest interval
  if (prevIdx === -1) {
    if (nowMs < new Date(sorted[0].time).getTime()) {
      prevIdx = 0;
      nextIdx = 1;
    } else {
      prevIdx = sorted.length - 2;
      nextIdx = sorted.length - 1;
    }
  }

  const prev = sorted[prevIdx];
  const next = sorted[nextIdx];

  const t0 = new Date(prev.time).getTime();
  const t1 = new Date(next.time).getTime();
  const h0 = prev.height;
  const h1 = next.height;

  // Clamp fraction between 0 and 1
  const fraction = Math.max(0, Math.min(1, (nowMs - t0) / (t1 - t0)));

  // Cosine interpolation formula
  const currentHeight = h0 + ((h1 - h0) * (1 - Math.cos(Math.PI * fraction))) / 2;

  let status: CurrentTideState['status'];
  if (fraction < 0.05) {
    status = prev.type === 'high' ? 'High Tide Peak' : 'Low Tide Slack';
  } else if (fraction > 0.95) {
    status = next.type === 'high' ? 'High Tide Peak' : 'Low Tide Slack';
  } else {
    status = h1 > h0 ? 'Rising' : 'Falling';
  }

  return {
    currentHeight: Number(currentHeight.toFixed(2)),
    status,
    previousExtreme: prev,
    nextExtreme: next,
    percentageBetween: Math.round(fraction * 100),
  };
}
