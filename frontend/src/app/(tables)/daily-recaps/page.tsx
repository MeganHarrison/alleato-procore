import { redirect } from 'next/navigation'

// This page has been moved to the (tables) route group
// Redirecting to the correct location
export default function DailyRecapsPage() {
  redirect('/daily-recaps')
}