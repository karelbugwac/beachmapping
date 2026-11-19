export type TourStatus = 'in_progress' | 'review' | 'approved';
export type TourActor = 'owner' | 'admin';

export class TourWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TourWorkflowError';
  }
}

export interface TourTransitionInput {
  actor: TourActor | string;
  fromStatus: TourStatus | string;
  toStatus: TourStatus | string;
  requestId: string;
  currentRequestId: string;
  note?: string | null;
}

const TOUR_STATUSES: TourStatus[] = ['in_progress', 'review', 'approved'];

export function canTransitionTour(input: TourTransitionInput): boolean {
  const { actor, fromStatus, toStatus, requestId, currentRequestId, note } = input;

  if (
    !TOUR_STATUSES.includes(fromStatus as TourStatus) ||
    !TOUR_STATUSES.includes(toStatus as TourStatus) ||
    !requestId ||
    requestId !== currentRequestId
  ) {
    return false;
  }

  if (actor === 'owner') {
    return fromStatus === 'in_progress' && toStatus === 'review';
  }

  if (actor === 'admin') {
    return (
      (fromStatus === 'review' && toStatus === 'approved') ||
      (fromStatus === 'review' && toStatus === 'in_progress' && Boolean(note?.trim()))
    );
  }

  return false;
}
