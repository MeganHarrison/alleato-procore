export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

interface BaseTable<Row, Insert = Row, Update = Partial<Row>> {
  Row: Row;
  Insert: Insert;
  Update: Update;
}

export interface Database {
  public: {
    Tables: {
      ai_insights: BaseTable<{
        id: number;
        project_id: number;
        document_id: string | null;
        insight_type: string | null;
        severity: string | null;
        title: string | null;
        description: string | null;
        confidence_score: number | null;
        exact_quotes: Json | null;
        numerical_data: Json | null;
        urgency_indicators: Json | null;
        business_impact: string | null;
        financial_impact: number | null;
        timeline_impact_days: number | null;
        stakeholders_affected: Json | null;
        status: string | null;
        metadata: Json | null;
      }>;
      document_metadata: BaseTable<{
        id: string;
        title: string | null;
        url: string | null;
        created_at: string | null;
        type: string | null;
        source: string | null;
        content: string | null;
        summary: string | null;
        transcript_url: string | null;
        participants: string | null;
        tags: string | null;
        category: string | null;
        storage_bucket_path: string | null;
        project_id: number | null;
        date: string | null;
        duration_minutes: number | null;
      }>;
      projects: BaseTable<{
        id: number;
        name: string | null;
        description: string | null;
        team_members: string[] | null;
        stakeholders: string[] | null;
        keywords: string[] | null;
        phase: string | null;
      }>;
    };
  };
}
