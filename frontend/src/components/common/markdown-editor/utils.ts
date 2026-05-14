export function preserveLineBreaks(text: string): string {
  const hardBreak = '  '
  const blankLine = ' ' + hardBreak
  const lines = text.split('\n')
  return lines
    .map((line, i) => {
      if (i === lines.length - 1) return line
      if (line.trim() === '') return blankLine
      return line + hardBreak
    })
    .join('\n')
}
