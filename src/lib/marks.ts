export const gradeNames = {
  good: 'Good',
  ok: 'OK',
  bad: 'Bad',
  info: 'For reference',
  na: "Doesn't apply",
  unknown: 'Unknown'
};

export type MarkKey = keyof typeof gradeNames;

// drawn on a 16x16 grid, shared by GradeMark and the social images
export const markPaths: Record<MarkKey, string> = {
  good: 'M3.5 8.5 6.5 11.5 12.5 4.5',
  ok: 'M3.5 9.5C5 6.5 6.8 6.5 8 8s3 1.5 4.5-1.5',
  bad: 'M4.5 4.5l7 7M11.5 4.5l-7 7',
  info: 'M8 7v5M8 4v.5',
  na: 'M4 8h8',
  unknown: 'M6 6.2a2 2 0 1 1 3 1.7c-.7.4-1 .9-1 1.6M8 11.8v.4'
};
