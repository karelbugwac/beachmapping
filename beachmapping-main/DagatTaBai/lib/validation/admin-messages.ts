export const ADMIN_MESSAGES = {
  notAllowed: "You don't have permission to do that.",
  staleChange: 'Someone else already changed this account. Refresh and try again.',
  rateLimited: 'Too many attempts. Please try again in a few minutes.',
  serverError: 'Something went wrong. Please try again.',
  reasonTypeRequired: 'Please choose a reason type.',
  statusChanged: 'Your account status has changed.',
  suspended: 'Your account is suspended.',
  reasonTooShort: 'Please give a reason of at least 10 characters.',
  reasonTooLong: 'The reason must be 500 characters or fewer.',
  suspensionReasonInvalid: "The reason contains characters that aren't allowed. Please use letters, numbers and basic punctuation only.",
  reasonTooManyLines: 'Please keep the reason to 5 lines or fewer.',
  suspensionDateInvalid: 'Choose a date in the future (up to 1 year).',
  invalidCharacters: "This field contains characters that aren't allowed. Please use letters, numbers and basic punctuation only.",
};

export const SUSPENSION_REASON_TYPES = [
  'Violation of community guidelines',
  'Fake or misleading information',
  'Spam or abuse',
  'Suspected fraud',
  'Owner request',
  'Other',
] as const;
