import { fetchSubmittals } from "./submittals-data";
import { SubmittalsClient } from "./submittals-client";

export default async function SubmittalsPage() {
  const submittals = await fetchSubmittals();

  return <SubmittalsClient submittals={submittals} />;
}
