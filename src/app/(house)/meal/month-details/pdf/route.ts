import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey } from "@/lib/data/months";
import {
  getDailyMealRecords,
  getDepositRecords,
  getBazaarRecords,
  getMemberMealSummary,
  pivotDailyMealsByDate,
} from "@/lib/data/meal";
import { MonthRecordsPdf } from "./MonthRecordsPdf";

export async function GET() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const { data: members } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("is_active", true)
    .order("last_name");
  const memberList = members ?? [];

  const [mealRecords, depositRecords, bazaarRecords, summary] = await Promise.all([
    getDailyMealRecords(supabase, monthKey),
    getDepositRecords(supabase, monthKey),
    getBazaarRecords(supabase, monthKey),
    getMemberMealSummary(supabase, monthKey, memberList),
  ]);

  const { rows: pivotRows, totals } = pivotDailyMealsByDate(mealRecords, memberList);

  const buffer = await renderToBuffer(
    MonthRecordsPdf({
      monthKey,
      memberNames: memberList.map((m) => getDisplayName(m)),
      summaryRows: summary.rows,
      mealRate: summary.mealRate,
      pivotRows,
      mealTotals: totals,
      depositRecords,
      bazaarRecords,
    })
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cottage-records-${monthKey}.pdf"`,
    },
  });
}
