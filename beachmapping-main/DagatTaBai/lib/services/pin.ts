import { createHmac } from 'crypto';

export function hashPin(pin: string) {
  const secret = process.env.PIN_LOOKUP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-emergency-secret-928202';
  return createHmac('sha256', secret).update(pin).digest('hex');
}