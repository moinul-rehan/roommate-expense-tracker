import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BazaarDuty = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  note: string | null;
};

/** All duties (current or upcoming) per member, for the admin Members page. */
export async function getUpcomingBazaarDuties(supabase: SupabaseClient, cottageId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("bazaar_duties")
    .select("id, user_id, start_date, end_date, note")
    .eq("cottage_id", cottageId)
    .gte("end_date", today)
    .order("start_date");

  const byUser = new Map<string, BazaarDuty[]>();
  for (const d of data ?? []) {
    const list = byUser.get(d.user_id) ?? [];
    list.push(d);
    byUser.set(d.user_id, list);
  }
  return byUser;
}

/** The current member's own current/next duty, for their Dashboard. */
export async function getMyNextBazaarDuty(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("bazaar_duties")
    .select("id, user_id, start_date, end_date, note")
    .eq("user_id", userId)
    .gte("end_date", today)
    .order("start_date")
    .limit(1)
    .maybeSingle();
  return data as BazaarDuty | null;
}
