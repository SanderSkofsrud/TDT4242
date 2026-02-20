export const AI_CATEGORIES = [
  { value: 'explanation', label: 'Explanation' },
  { value: 'structure', label: 'Structure' },
  { value: 'rephrasing', label: 'Rephrasing' },
  { value: 'code_assistance', label: 'Code Assistance' },
] as const

export const FREQUENCY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'extensive', label: 'Extensive' },
] as const

export const CATEGORY_GLOSSARY: Record<string, string> = {
  explanation:
    'Using AI to understand a concept, theory, or piece of feedback. The AI acts as a tutor.',
  structure:
    'Using AI to organise or outline your work. The ideas are yours — AI assists with the shape.',
  rephrasing:
    'Using AI to improve clarity or grammar of text you have already written.',
  code_assistance:
    'Using AI to support programming work. Check your assignment guidance for permitted boundaries.',
}
