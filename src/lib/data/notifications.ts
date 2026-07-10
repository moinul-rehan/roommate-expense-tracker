import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUnreadCount(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function getNotifications(supabase: SupabaseClient, userId: string, limit = 30) {
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Insert a notification for every given user. Call from server actions after the triggering write. */
export async function notifyUsers(
  supabase: SupabaseClient,
  cottageId: string,
  userIds: string[],
  notification: { type: string; title: string; body?: string; link?: string }
) {
  if (userIds.length === 0) return;
  await supabase.from("notifications").insert(
    userIds.map((userId) => ({
      cottage_id: cottageId,
      user_id: userId,
      ...notification,
    }))
  );
}
