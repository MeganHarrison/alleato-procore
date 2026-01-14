import { createClient } from "@/lib/supabase/server";

export default async function DailyLogDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("daily_logs").select("*").eq("id", id).single();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Daily Log Detail</h1>
      <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

