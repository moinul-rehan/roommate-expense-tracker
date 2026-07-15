import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const COLORS = {
  primary: "#DE7356",
  foreground: "#17191E",
  muted: "#7A818D",
  border: "#E4E5E8",
  headerBg: "#FBEAE5",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: COLORS.foreground, fontFamily: "Helvetica" },
  brand: { fontSize: 14, fontWeight: 700, color: COLORS.primary, marginBottom: 2 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: COLORS.muted, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  table: { display: "flex", width: "auto" },
  row: { flexDirection: "row", borderBottom: `1px solid ${COLORS.border}` },
  headerRow: { flexDirection: "row", backgroundColor: COLORS.headerBg },
  totalRow: { flexDirection: "row", borderTop: `1px solid ${COLORS.foreground}`, fontWeight: 700 },
  cell: { padding: 5, flex: 1 },
  cellRight: { padding: 5, flex: 1, textAlign: "right" },
  headerCell: { padding: 5, flex: 1, fontWeight: 700, color: COLORS.primary },
  headerCellRight: { padding: 5, flex: 1, fontWeight: 700, color: COLORS.primary, textAlign: "right" },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 8, color: COLORS.muted, textAlign: "center" },
});

type SummaryRow = {
  id: string;
  first_name: string;
  last_name: string | null;
  meals: number;
  deposit: number;
  cost: number;
  balance: number;
};

type MemberRef = { first_name: string; last_name: string | null } | null;

function name(m: MemberRef) {
  if (!m) return "—";
  return [m.first_name, m.last_name].filter(Boolean).join(" ");
}

function displayName(m: { first_name: string; last_name: string | null }) {
  return [m.first_name, m.last_name].filter(Boolean).join(" ");
}

export function MonthRecordsPdf({
  monthKey,
  summaryRows,
  mealRate,
  pivotRows,
  memberNames,
  mealTotals,
  depositRecords,
  bazaarRecords,
}: {
  monthKey: string;
  memberNames: string[];
  summaryRows: SummaryRow[];
  mealRate: number;
  pivotRows: { date: string; counts: number[] }[];
  mealTotals: number[];
  depositRecords: { id: string; deposit_date: string; amount: number; note: string | null; member: MemberRef }[];
  bazaarRecords: { id: string; entry_date: string; amount: number; description: string | null; member: MemberRef }[];
}) {
  return (
    <Document>
      {/* Page 1 — Summary + Meal Records */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>Cottage</Text>
        <Text style={styles.title}>Month Records — {monthKey}</Text>
        <Text style={styles.subtitle}>
          Meal rate: {mealRate.toFixed(2)} tk/meal · Generated for every member of the cottage
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Summary</Text>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>Member</Text>
              <Text style={styles.headerCellRight}>Meals</Text>
              <Text style={styles.headerCellRight}>Meal Cost</Text>
              <Text style={styles.headerCellRight}>Deposit</Text>
              <Text style={styles.headerCellRight}>Balance</Text>
            </View>
            {summaryRows.map((r) => (
              <View style={styles.row} key={r.id}>
                <Text style={styles.cell}>{displayName(r)}</Text>
                <Text style={styles.cellRight}>{r.meals}</Text>
                <Text style={styles.cellRight}>{r.cost.toFixed(2)} tk</Text>
                <Text style={styles.cellRight}>{r.deposit.toFixed(2)} tk</Text>
                <Text style={styles.cellRight}>{r.balance.toFixed(2)} tk</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Records (per day)</Text>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>Date</Text>
              {memberNames.map((n) => (
                <Text style={styles.headerCellRight} key={n}>
                  {n}
                </Text>
              ))}
            </View>
            {pivotRows.map((row) => (
              <View style={styles.row} key={row.date}>
                <Text style={styles.cell}>{row.date}</Text>
                {row.counts.map((c, i) => (
                  <Text style={styles.cellRight} key={memberNames[i]}>
                    {c || "—"}
                  </Text>
                ))}
              </View>
            ))}
            {!pivotRows.length && <Text style={{ padding: 8, color: COLORS.muted }}>No meal entries.</Text>}
            {!!pivotRows.length && (
              <View style={styles.totalRow}>
                <Text style={styles.cell}>Total</Text>
                {mealTotals.map((t, i) => (
                  <Text style={styles.cellRight} key={memberNames[i]}>
                    {t}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Cottage · Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 2 — Deposit Records */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Deposit Records — {monthKey}</Text>
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Member</Text>
              <Text style={styles.headerCell}>Note</Text>
              <Text style={styles.headerCellRight}>Amount</Text>
            </View>
            {depositRecords.map((r) => (
              <View style={styles.row} key={r.id}>
                <Text style={styles.cell}>{r.deposit_date}</Text>
                <Text style={styles.cell}>{name(r.member)}</Text>
                <Text style={styles.cell}>{r.note ?? "—"}</Text>
                <Text style={styles.cellRight}>{Number(r.amount).toFixed(2)} tk</Text>
              </View>
            ))}
            {!depositRecords.length && <Text style={{ padding: 8, color: COLORS.muted }}>No deposits recorded.</Text>}
          </View>
        </View>
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Cottage · Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 3 — Meal Cost (Bazaar) Records */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Meal Cost Records — {monthKey}</Text>
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Spent By</Text>
              <Text style={styles.headerCell}>Description</Text>
              <Text style={styles.headerCellRight}>Amount</Text>
            </View>
            {bazaarRecords.map((r) => (
              <View style={styles.row} key={r.id}>
                <Text style={styles.cell}>{r.entry_date}</Text>
                <Text style={styles.cell}>{name(r.member)}</Text>
                <Text style={styles.cell}>{r.description ?? "—"}</Text>
                <Text style={styles.cellRight}>{Number(r.amount).toFixed(2)} tk</Text>
              </View>
            ))}
            {!bazaarRecords.length && <Text style={{ padding: 8, color: COLORS.muted }}>No meal cost entries.</Text>}
          </View>
        </View>
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Cottage · Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
