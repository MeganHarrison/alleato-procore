import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RfisTable, type RfiRow } from "@/components/rfis/rfis-table";

export default async function RFIsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rfis")
    .select(
      `
      *,
      projects (
        id,
        name
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching RFIs:", error);
    return <div>Error loading RFIs</div>;
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RFIs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Requests for Information
          </p>
        </div>
        <Button
          asChild
          className="bg-[hsl(var(--procore-orange))] hover:bg-[hsl(var(--procore-orange))]/90"
        >
          <Link href="/form-rfi">
            <Plus className="h-4 w-4 mr-2" />
            Create RFI
          </Link>
        </Button>
      </div>

      <RfisTable rfis={(data as RfiRow[]) || []} showProjectColumn />
    </div>
  );
}
