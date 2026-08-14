import { redirect } from 'next/navigation';

/**
 * Root Page - Redirects to Dashboard
 */
export default function RootPage() {
  redirect('/dashboard');
}
