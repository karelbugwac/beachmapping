import test from 'node:test';
import assert from 'node:assert/strict';
import { BEACH_ADDRESS_MESSAGES } from '../lib/constants/location';
import { validateBeachAddress } from '../lib/validation/beachAddress';
import { POST } from '../app/api/applications/route';

test('beach address accepts the default and detailed Binongkalan addresses', () => {
  const accepted = [
    'Barangay Binongkalan, Catmon, Cebu',
    'Purok 3, Barangay Binongkalan, Catmon, Cebu',
    'Sitio Lamesa, Brgy. Binongkalan, Catmon, Cebu',
  ];

  for (const address of accepted) {
    const result = validateBeachAddress(address);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value, address);
      assert.equal(result.warning, null);
    }
  }
});

test('beach address rejects unsafe characters, invisible characters, and invalid lengths', () => {
  const rejected = [
    'a=b',
    '1=1',
    "x'; DROP TABLE beaches;--",
    '<script>alert(1)</script>',
    '＝',
    '\u200B',
    '',
    'abc',
    'A'.repeat(151),
  ];

  for (const address of rejected) {
    const result = validateBeachAddress(address);
    assert.equal(result.ok, false, 'Expected input to be rejected');
    if (address) assert.equal(result.error?.includes(address), false, 'Error must not echo the input');
  }

  assert.equal(validateBeachAddress('a=b').error, BEACH_ADDRESS_MESSAGES.invalidCharacters);
  assert.equal(validateBeachAddress('A'.repeat(151)).error, BEACH_ADDRESS_MESSAGES.tooLong);
});

test('a valid address outside Binongkalan receives a soft warning', () => {
  const result = validateBeachAddress('Poblacion, Catmon, Cebu');
  assert.equal(result.ok, true);
  assert.equal(result.warning, BEACH_ADDRESS_MESSAGES.binongkalanWarning);
});

test('applications API rejects an invalid address with 400 before database work', async () => {
  const formData = new FormData();
  formData.set('applicant_full_name', 'Mina Villamor');
  formData.set('applicant_email', 'mina@example.com');
  formData.set('business_name', 'Mina Beach Resort');
  formData.set('beach_name', 'Mina Beach');
  formData.set('beach_location', 'a=b');
  formData.set('contact_phone', '+63 917 123 4567');
  formData.set('agreeToTerms', 'true');
  formData.set('business_permit', new File(['%PDF-1.7 test'], 'permit.pdf', { type: 'application/pdf' }));
  formData.set('proof_of_ownership', new File(['%PDF-1.7 test'], 'ownership.pdf', { type: 'application/pdf' }));

  const response = await POST(new Request('http://localhost/api/applications', {
    method: 'POST',
    body: formData,
  }));

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, BEACH_ADDRESS_MESSAGES.invalidCharacters);
});