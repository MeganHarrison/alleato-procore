import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

import type { Database } from '../types/database_types';
import type { DocumentMetadata, ProjectAssignmentResult } from './insights';
import { InsightGenerationService } from './InsightGenerationService';
import { ProjectAssignmentService } from './ProjectAssignmentService';

export class ProjectsInsightsService {
  private readonly assignmentService: ProjectAssignmentService;
  private readonly insightService: InsightGenerationService;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    openai: OpenAI
  ) {
    this.assignmentService = new ProjectAssignmentService(openai);
    this.insightService = new InsightGenerationService(openai);
  }

  async processDocument(documentId: string, forceReprocess = false) {
    try {
      const { data: document, error: docError } = await this.supabase
        .from('document_metadata')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error(`Document not found: ${docError?.message}`);
      }

      if (!document.content || document.content.length < 200) {
        return { success: false, message: 'Document has insufficient content for analysis' };
      }

      if (!forceReprocess) {
        const { data: existingInsights } = await this.supabase
          .from('ai_insights')
          .select('id')
          .eq('document_id', documentId)
          .limit(1);

        if (existingInsights && existingInsights.length > 0) {
          return { success: true, message: 'Document already processed' };
        }
      }

      const { data: projects, error: projError } = await this.supabase
        .from('projects')
        .select('id, name, description, team_members, stakeholders, keywords, phase');

      if (projError) {
        throw new Error(`Failed to fetch projects: ${projError.message}`);
      }

      const projectAssignments: ProjectAssignmentResult[] = await this.assignmentService.assignProjects(
        document as DocumentMetadata,
        projects || []
      );

      if (projectAssignments.length === 0) {
        return { success: false, message: 'No projects could be confidently assigned to this meeting' };
      }

      let totalInsights = 0;

      for (const assignment of projectAssignments) {
        const insights = await this.insightService.generateInsights(
          document as DocumentMetadata,
          assignment
        );

        for (const insight of insights) {
          const { error: insertError } = await this.supabase
            .from('ai_insights')
            .insert({
              project_id: assignment.projectId,
              document_id: documentId,
              insight_type: insight.type,
              severity: insight.severity,
              title: insight.title,
              description: insight.description,
              confidence_score: insight.confidence,
              exact_quotes: insight.exactQuotes || [],
              numerical_data: insight.numericalData || [],
              urgency_indicators: insight.urgencyIndicators || [],
              business_impact: insight.businessImpact,
              financial_impact: insight.financialImpact,
              timeline_impact_days: insight.timelineImpactDays,
              stakeholders_affected: insight.stakeholdersAffected || [],
              status: 'open',
              metadata: {
                meeting_title: document.title,
                meeting_date: document.date,
                project_assignment_confidence: assignment.confidence,
                project_assignment_reasoning: assignment.reasoning
              }
            });

          if (insertError) {
            console.error('Failed to insert insight:', insertError);
          } else {
            totalInsights++;
          }
        }
      }

      return {
        success: true,
        message: `Generated ${totalInsights} insights for ${projectAssignments.length} projects`,
        insightsGenerated: totalInsights
      };
    } catch (error: any) {
      console.error(`Error processing document ${documentId}:`, error);
      return {
        success: false,
        message: error?.message || 'Unknown error occurred'
      };
    }
  }
}
