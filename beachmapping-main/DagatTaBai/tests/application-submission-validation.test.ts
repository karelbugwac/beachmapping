import assert from 'node:assert/strict';
import test from 'node:test';
import { userRegisterSchema } from '../lib/validation/auth';
import {
  isPendingApplicationConflict,
  PENDING_APPLICATION_MESSAGE,
} from '../lib/validation/application-submission';
import { EMAIL_TAKEN_MESSAGE, isDuplicateAuthEmailError } from '../lib/validation/registration';

test('duplicate pending application conflicts are recognized from the database guard', () => {
  assert.equal(isPendingApplicationConflict({
    code: '23505',
    constraint: 'owner_applications_one_pending_per_applicant',
  }), true);
  assert.equal(isPendingApplicationConflict({
    code: '23505',
    constraint: 'idx_owner_applications_pending_email',
  }), true);
  assert.equal(isPendingApplicationConflict({
    code: '23505',
    message: 'duplicate key value violates unique constraint "profiles_pkey"',
  }), false);
  assert.equal(PENDING_APPLICATION_MESSAGE, 'You already have a pending application with this email.');
});

test('duplicate authentication email errors map to the stable registration message', () => {
  assert.equal(isDuplicateAuthEmailError({ code: 'email_exists', message: 'User already registered' }), true);
  assert.equal(isDuplicateAuthEmailError({ message: 'A user with this email already exists' }), true);
  assert.equal(isDuplicateAuthEmailError({ code: 'weak_password', message: 'Password is too weak' }), false);
  assert.equal(EMAIL_TAKEN_MESSAGE, 'This email is taken.');
});

test('registration email is normalized and unexpected JSON fields are rejected', () => {
  const parsed = userRegisterSchema.safeParse({
    name: 'Juan Dela Cruz',
    email: '  USER@Example.COM  ',
    password: 'secure1',
    confirmPassword: 'secure1',
    agreeToPrivacyPolicy: true,
  });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.email, 'user@example.com');

  assert.equal(userRegisterSchema.safeParse({
    name: 'Juan Dela Cruz',
    email: 'user@example.com',
    password: 'secure1',
    confirmPassword: 'secure1',
    agreeToPrivacyPolicy: true,
    role: 'admin',
  }).success, false);
});
