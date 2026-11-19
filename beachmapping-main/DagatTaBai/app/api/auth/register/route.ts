import { NextRequest, NextResponse } from 'next/server';
import { registerLocalUser } from '@/lib/db/auth';
import { userRegisterSchema } from '@/lib/validation/auth';
import { FULL_NAME_MESSAGES, validateFullName } from '@/lib/validation/fullName';
import { EMAIL_TAKEN_MESSAGE } from '@/lib/validation/registration';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid registration details.' }, { status: 400 });
    }
    const candidateName = (body as Record<string, unknown>).name;
    const nameValidation = validateFullName(candidateName);
    if (!nameValidation.ok) {
      return NextResponse.json({ error: FULL_NAME_MESSAGES.serverRejected }, { status: 400 });
    }

    const parsed = userRegisterSchema.safeParse({ ...body, name: nameValidation.value });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid registration details.' }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const { user, error, requiresEmailConfirmation } = await registerLocalUser(name, email, password);
    if (error || !user) {
      if (error === EMAIL_TAKEN_MESSAGE) {
        return NextResponse.json({ error: EMAIL_TAKEN_MESSAGE }, { status: 409 });
      }
      return NextResponse.json(
        { error: 'Registration could not be completed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, user, requiresEmailConfirmation },
      { status: requiresEmailConfirmation ? 202 : 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Registration could not be completed. Please try again.' }, { status: 500 });
  }
}
