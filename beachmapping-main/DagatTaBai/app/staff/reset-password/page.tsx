import { redirect } from 'next/navigation';

export default function LegacyStaffPasswordPage() {
  redirect('/owner/login');
}