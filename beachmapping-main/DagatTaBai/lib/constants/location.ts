export const DEFAULT_BEACH_ADDRESS = 'Barangay Binongkalan, Catmon, Cebu';

export const BEACH_ADDRESS_MESSAGES = {
  required: 'Please enter the address of your beach resort.',
  tooLong: 'The address must be 150 characters or fewer.',
  invalidCharacters: "The address contains characters that aren't allowed. Please use letters, numbers and basic punctuation only.",
  binongkalanWarning: "This address doesn't mention Binongkalan. Is your beach resort located in Barangay Binongkalan, Catmon, Cebu?",
  helper: 'Add your purok, sitio, street or a landmark in front of the barangay, so tourists can find you easily.',
  placeholder: 'Purok / street, Barangay, Municipality, Province',
} as const;