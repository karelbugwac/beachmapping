import { redirect } from 'next/navigation';

export default function LegacyStaffLoginPage() {
  redirect('/owner/login');
}