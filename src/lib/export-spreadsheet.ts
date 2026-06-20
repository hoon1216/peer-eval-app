type CourseWeights = {
  peer: number;
  observer: number;
  lead: number;
};

/** 1-based column index to Excel column letter (1 = A). */
export function excelColumnLetter(index: number): string {
  let n = index;
  let letters = "";
  while (n > 0) {
    n -= 1;
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26);
  }
  return letters;
}

export function peerAverageFormula(
  row: number,
  firstPeerCol: number,
  lastPeerCol: number
): string {
  if (lastPeerCol < firstPeerCol) {
    return '=""';
  }
  const start = excelColumnLetter(firstPeerCol);
  const end = excelColumnLetter(lastPeerCol);
  return `=IF(COUNT(${start}${row}:${end}${row}),ROUND(AVERAGE(${start}${row}:${end}${row}),1),"")`;
}

export function weightedFinalFormula(
  row: number,
  peerCol: number,
  observerCol: number,
  leadCol: number,
  weights: CourseWeights
): string {
  const peer = excelColumnLetter(peerCol);
  const observer = excelColumnLetter(observerCol);
  const lead = excelColumnLetter(leadCol);
  const { peer: wPeer, observer: wObserver, lead: wLead } = weights;

  return (
    `=IF(AND(${peer}${row}="",${observer}${row}="",${lead}${row}=""),"",` +
    `ROUND((IF(${peer}${row}<>"",${peer}${row}*${wPeer},0)+` +
    `IF(${observer}${row}<>"",${observer}${row}*${wObserver},0)+` +
    `IF(${lead}${row}<>"",${lead}${row}*${wLead},0))/` +
    `(IF(${peer}${row}<>"",${wPeer},0)+` +
    `IF(${observer}${row}<>"",${wObserver},0)+` +
    `IF(${lead}${row}<>"",${wLead},0)),1))`
  );
}

export function rankFormula(
  row: number,
  gradeCol: number,
  firstDataRow: number,
  lastDataRow: number
): string {
  const grade = excelColumnLetter(gradeCol);
  return `=IF(${grade}${row}="","",RANK(${grade}${row},$${grade}$${firstDataRow}:$${grade}$${lastDataRow},0))`;
}

export function buildExportColumnLayout(evaluatorCount: number) {
  const fixedCols = 4;
  const firstPeerCol = fixedCols + 1;
  const lastPeerCol = evaluatorCount > 0 ? firstPeerCol + evaluatorCount - 1 : 0;
  const peerAvgCol = evaluatorCount > 0 ? lastPeerCol + 1 : firstPeerCol;
  const observerCol = peerAvgCol + 1;
  const leadCol = observerCol + 1;
  const finalCol = leadCol + 1;
  const rankCol = finalCol + 1;

  return {
    fixedCols,
    firstPeerCol,
    lastPeerCol,
    peerAvgCol,
    observerCol,
    leadCol,
    finalCol,
    rankCol,
  };
}
