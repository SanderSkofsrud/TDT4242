export interface User {
  id: string
  email?: string
  role: 'student' | 'instructor' | 'head_of_faculty' | 'admin'
  privacyAckVersion: number
}

export interface Course {
  id: string
  code: string
  name: string
  facultyId: string
  createdAt: string
}

export interface Assignment {
  id: string
  courseId: string
  title: string
  dueDate: string
  createdAt: string
}

export interface StudentAssignment {
  id: string
  title: string
  dueDate: string
  course: {
    id: string
    code: string
    name: string
  }
  declaration: {
    id: string
    submittedAt: string
  } | null
}

export interface AssignmentGuidance {
  id: string
  assignmentId: string
  permittedText: string
  prohibitedText: string
  permittedCategories: Array<'explanation' | 'structure' | 'rephrasing' | 'code_assistance'> | null
  prohibitedCategories: Array<'explanation' | 'structure' | 'rephrasing' | 'code_assistance'> | null
  examples: {
    permitted: string[]
    prohibited: string[]
  } | null
  createdBy: string
  lockedAt: string | null
  createdAt: string
}

export interface Declaration {
  id: string
  studentId: string
  assignmentId: string
  toolsUsed: string[]
  categories: Array<'explanation' | 'structure' | 'rephrasing' | 'code_assistance'>
  frequency: 'none' | 'light' | 'moderate' | 'extensive'
  contextText: string | null
  policyVersion: number
  submittedAt: string
  expiresAt: string
}

export interface PolicyDocument {
  version: number
  filePath: string
}

export interface FeedbackTemplate {
  category: string | null
  triggerCondition: string
  templateText: string
}

export interface SharingPreference {
  studentId: string
  courseId: string
  courseCode: string
  courseName: string
  isShared: boolean
  updatedAt: string
}

export interface FeedbackResponse {
  declarationId: string
  categories: string[]
  frequency: string
  guidance: {
    permittedText: string
    prohibitedText: string
    permittedCategories: string[] | null
    prohibitedCategories: string[] | null
    examples: object | null
  } | null
  mismatches: Array<{
    category: string
    message: string
  }>
  feedbackTemplates: FeedbackTemplate[]
  policyVersion: number
  policyFilePath: string
}

export interface StudentDashboardResponse {
  declarations: Declaration[]
  summary: {
    totalDeclarations: number
    byCategory: Record<string, number>
    byFrequency: Record<string, number>
    perAssignment: Array<{
      assignmentId: string
      totalDeclarations: number
      byCategory: Record<string, number>
      byFrequency: Record<string, number>
    }>
    perMonth: Array<{
      month: string
      totalDeclarations: number
      byCategory: Record<string, number>
      byFrequency: Record<string, number>
    }>
  }
}

export interface StudentAssignmentsResponse {
  assignments: StudentAssignment[]
}

export interface InstructorAssignment {
  id: string
  courseId: string
  title: string
  dueDate: string
  guidance: {
    id: string
    lockedAt: string | null
  } | null
}

export interface InstructorAssignmentsResponse {
  courseId: string
  assignments: InstructorAssignment[]
}

export interface InstructorAggregateRow {
  assignmentId: string
  courseId: string
  category: string
  frequency: string
  declarationCount: number
}

export interface InstructorCourse {
  id: string
  code: string
  name: string
}

export interface InstructorCoursesResponse {
  courses: InstructorCourse[]
}

export interface InstructorDashboardResponse {
  suppressed: boolean
  courseId?: string
  message?: string
  aggregationLevel?: 'assignment_category_frequency' | 'category_frequency' | 'category'
  privacyThreshold?: number
  enrolledStudents?: number
  sharedStudentsWithDeclarations?: number
  suppressedDeclarationCount?: number
  data?: InstructorAggregateRow[]
}

export interface FacultyAggregateRow {
  courseId: string
  facultyId: string
  courseCode: string
  courseName: string
  category: string
  frequency: string
  declarationCount: number
}

export interface FacultyDashboardResponse {
  suppressed: boolean
  facultyId?: string
  message?: string
  aggregationLevel?: 'assignment_category_frequency' | 'category_frequency' | 'category'
  privacyThreshold?: number
  enrolledStudents?: number
  sharedStudentsWithDeclarations?: number
  suppressedDeclarationCount?: number
  data?: FacultyAggregateRow[]
}

