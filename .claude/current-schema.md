# Current Schema Snapshot (from existing generated types)

Timestamp: 2026-01-13T18:30:00Z
Source: frontend/src/types/database.types.ts (pre-existing; supabase type generation blocked)

## rfis
- assignees: string[] | null
- ball_in_court: string | null
- ball_in_court_employee_id: number | null
- closed_date: string | null
- cost_code: string | null
- cost_impact: string | null
- created_at: string
- created_by: string | null
- created_by_employee_id: number | null
- date_initiated: string | null
- distribution_list: string[] | null
- due_date: string | null
- id: string
- is_private: boolean
- location: string | null
- number: number
- project_id: number
- question: string
- received_from: string | null
- reference: string | null
- responsible_contractor: string | null
- rfi_manager: string | null
- rfi_manager_employee_id: number | null
- rfi_stage: string | null
- schedule_impact: string | null
- specification: string | null
- status: string
- sub_job: string | null
- subject: string
- updated_at: string

## rfi_assignees
- created_at: string
- employee_id: number
- is_primary: boolean
- rfi_id: string
