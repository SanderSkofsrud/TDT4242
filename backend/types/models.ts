export interface User {
  id: string
  email: string
  password_hash: string
  role: 'student' | 'instructor' | 'head_of_faculty' | 'admin'
  privacy_ack_version: number
  created_at: Date
}

export interface Course {
  id: string
  code: string
  name: string
  faculty_id: string
  created_at: Date
}

export interface Enrolment {
  user_id: string
  course_id: string
  role: 'student' | 'instructor'
}

export interface Assignment {
  id: string
  course_id: string
  title: string
  due_date: Date
  created_at: Date
}

export interface AssignmentGuidanceExamples {
  permitted: string[]
  prohibited: string[]
}

export interface AssignmentGuidance {
  id: string
  assignment_id: string
  permitted_text: string
  prohibited_text: string
  permitted_categories: DeclarationCategory[] | null
  prohibited_categories: DeclarationCategory[] | null
  examples: AssignmentGuidanceExamples | null
  created_by: string
  locked_at: Date | null
  created_at: Date
}

export type DeclarationFrequency = 'none' | 'light' | 'moderate' | 'extensive'

export type DeclarationCategory =
  | 'explanation'
  | 'structure'
  | 'rephrasing'
  | 'code_assistance'

export interface Declaration {
  id: string
  student_id: string
  assignment_id: string
  tools_used: string[]
  categories: DeclarationCategory[]
  frequency: DeclarationFrequency
  context_text: string | null
  policy_version: number
  submitted_at: Date
  expires_at: Date
}

export interface PolicyDocument {
  id: string
  version: number
  file_path: string
  uploaded_by: string
  uploaded_at: Date
  is_current: boolean
}

export interface FeedbackTemplate {
  id: string
  category: string | null
  trigger_condition: string
  template_text: string
  policy_version: number
  created_by: string
  created_at: Date
}

export interface SharingPreference {
  student_id: string
  course_id: string
  is_shared: boolean
  updated_at: Date
}

export interface AccessLog {
  id: string
  actor_id: string
  capability: string
  resource_id: string | null
  accessed_at: Date
  expires_at: Date
}

