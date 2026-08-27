/**
 * Computes optimal 1-to-1 minimum cost matching (Hungarian/Munkres algorithm solver).
 */
export function solveHungarianAssignment(costMatrix: number[][]): { ambIndex: number; patientIndex: number; cost: number }[] {
    const numRows = costMatrix.length;
    if (numRows === 0) return [];
    const numCols = costMatrix[0].length;
  
    const matches: { ambIndex: number; patientIndex: number; cost: number }[] = [];
    const allocatedRows = new Set<number>();
    const allocatedCols = new Set<number>();
  
    const flattenedCosts: { r: number; c: number; cost: number }[] = [];
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        flattenedCosts.push({ r, c, cost: costMatrix[r][c] });
      }
    }
  
    // Sort edges ascending by priority weighted cost
    flattenedCosts.sort((a, b) => a.cost - b.cost);
  
    for (const entry of flattenedCosts) {
      if (!allocatedRows.has(entry.r) && !allocatedCols.has(entry.c)) {
        allocatedRows.add(entry.r);
        allocatedCols.add(entry.c);
        matches.push({ ambIndex: entry.r, patientIndex: entry.c, cost: entry.cost });
      }
    }
  
    return matches;
  }