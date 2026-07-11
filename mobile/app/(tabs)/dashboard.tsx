import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { colors, radius } from "@/lib/theme";

type Stats = {
  monthKey: string;
  totalMeals: number;
  totalBazaar: number;
  totalUtility: number;
};

export default function DashboardScreen() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;

    const { data: cottage } = await supabase
      .from("cottages")
      .select("active_month_key")
      .eq("id", profile.cottage_id)
      .single();

    const monthKey = cottage?.active_month_key ?? new Date().toISOString().slice(0, 7);
    const start = `${monthKey}-01`;
    const end = `${monthKey}-31`;

    const [mealsRes, bazaarRes, expensesRes] = await Promise.all([
      supabase
        .from("daily_meals")
        .select("count")
        .eq("cottage_id", profile.cottage_id)
        .eq("month_key", monthKey),
      supabase
        .from("bazaar_entries")
        .select("amount")
        .eq("cottage_id", profile.cottage_id)
        .eq("month_key", monthKey),
      supabase
        .from("expenses")
        .select("amount")
        .eq("cottage_id", profile.cottage_id)
        .gte("expense_date", start)
        .lte("expense_date", end),
    ]);

    const totalMeals = (mealsRes.data ?? []).reduce((sum, r) => sum + Number(r.count), 0);
    const totalBazaar = (bazaarRes.data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
    const totalUtility = (expensesRes.data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);

    setStats({ monthKey, totalMeals, totalBazaar, totalUtility });
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time: any insert/update/delete on these tables for this cottage
  // refetches the totals instantly, no pull-to-refresh needed.
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel(`dashboard-${profile.cottage_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_meals", filter: `cottage_id=eq.${profile.cottage_id}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bazaar_entries", filter: `cottage_id=eq.${profile.cottage_id}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `cottage_id=eq.${profile.cottage_id}` },
        () => load()
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome, {profile?.first_name}</Text>
            <View style={styles.liveRow}>
              <View style={[styles.liveDot, { backgroundColor: live ? colors.green : colors.muted }]} />
              <Text style={styles.liveText}>{live ? "Live" : "Connecting…"}</Text>
            </View>
          </View>
          <Text style={styles.signOut} onPress={signOut}>
            Log out
          </Text>
        </View>

        <View style={styles.cardRow}>
          <StatCard label="Total meals" value={String(stats.totalMeals)} tone={colors.primary} bg={colors.primaryLight} />
          <StatCard label="Total bazaar" value={stats.totalBazaar.toFixed(2)} tone={colors.orange} bg="#FA903326" />
        </View>
        <StatCard label="Utility expenses this month" value={stats.totalUtility.toFixed(2)} tone={colors.green} bg="#63B64E26" wide />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  tone,
  bg,
  wide,
}: {
  label: string;
  value: string;
  tone: string;
  bg: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.card, wide && styles.cardWide]}>
      <View style={[styles.iconChip, { backgroundColor: bg }]}>
        <View style={[styles.iconDot, { backgroundColor: tone }]} />
      </View>
      <View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  welcome: { fontSize: 22, fontWeight: "700", color: colors.foreground },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, color: colors.muted },
  signOut: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  cardRow: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 16,
  },
  cardWide: { flex: undefined },
  iconChip: { width: 44, height: 44, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  iconDot: { width: 12, height: 12, borderRadius: 6 },
  cardLabel: { fontSize: 12, color: colors.muted },
  cardValue: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 2 },
});
