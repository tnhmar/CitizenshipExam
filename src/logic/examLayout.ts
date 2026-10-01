export function isFocusedExamPath(path: string): boolean {
  return /^\/exams\/(?:\d+|summary)\/?$/.test(path);
}
