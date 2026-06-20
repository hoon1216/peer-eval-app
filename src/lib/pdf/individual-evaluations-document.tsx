import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  COMMENT_LABEL,
  COMPLETENESS_LABEL,
  formatCompletenessScore,
} from "@/lib/evaluation-labels";
import type { IndividualEvaluationRow } from "@/lib/export-evaluation-details";
import path from "node:path";

Font.register({
  family: "NotoSansKR",
  fonts: [
    {
      src: path.join(
        process.cwd(),
        "public",
        "fonts",
        "NotoSansCJKkr-Regular.otf"
      ),
      fontWeight: 400,
    },
    {
      src: path.join(
        process.cwd(),
        "public",
        "fonts",
        "NotoSansCJKkr-Bold.otf"
      ),
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "NotoSansKR" },
  title: { fontSize: 18, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 11, marginBottom: 16, color: "#444" },
  table: {
    borderWidth: 1,
    borderColor: "#333",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#eef4ff",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerCell: {
    padding: 8,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  cell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    lineHeight: 1.4,
  },
  evaluatorCol: { width: "16%" },
  assignmentCol: { width: "24%" },
  scoreCol: { width: "10%", textAlign: "center" },
  commentCol: { width: "50%", borderRightWidth: 0 },
  empty: { padding: 16, color: "#666", textAlign: "center" },
});

export type IndividualEvaluationsPdfProps = {
  courseName: string;
  semester: string;
  rows: IndividualEvaluationRow[];
};

export function IndividualEvaluationsPdfDocument(
  props: IndividualEvaluationsPdfProps
) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>개별 평가 내역</Text>
        <Text style={styles.subtitle}>
          {props.courseName} · {props.semester}
        </Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.evaluatorCol]}>
              평가자
            </Text>
            <Text style={[styles.headerCell, styles.assignmentCol]}>
              평가과제
            </Text>
            <Text style={[styles.headerCell, styles.scoreCol]}>
              {COMPLETENESS_LABEL}
            </Text>
            <Text style={[styles.headerCell, styles.commentCol]}>
              {COMMENT_LABEL}
            </Text>
          </View>

          {props.rows.length === 0 ? (
            <Text style={styles.empty}>제출된 동료평가가 없습니다.</Text>
          ) : (
            props.rows.map((row, index) => (
              <View key={`row-${index}`} style={styles.row} wrap={false}>
                <Text style={[styles.cell, styles.evaluatorCol]}>
                  {row.evaluatorName}
                </Text>
                <Text style={[styles.cell, styles.assignmentCol]}>
                  {row.assignmentTitle}
                </Text>
                <Text style={[styles.cell, styles.scoreCol]}>
                  {formatCompletenessScore(row.score)}
                </Text>
                <Text style={[styles.cell, styles.commentCol]}>
                  {row.comment || "—"}
                </Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}
