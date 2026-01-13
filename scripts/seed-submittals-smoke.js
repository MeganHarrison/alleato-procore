/**
 * Submittals smoke test data seeder
 *
 * Purpose: create deterministic records for Playwright smoke tests so runs are stable and independent
 * of manual data.
 *
 * Requirements:
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars set (service key required for inserts bypassing RLS)
 * - SUBMITTALS_PROJECT_ID (integer) for the target project
 * - SUBMITTALS_USER_ID (uuid) for the actor/uploader
 * - Node 18+
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUBMITTALS_PROJECT_ID=123 SUBMITTALS_USER_ID=<uuid> node scripts/seed-submittals-smoke.js
 */

import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUBMITTALS_PROJECT_ID, SUBMITTALS_USER_ID } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!SUBMITTALS_PROJECT_ID || !SUBMITTALS_USER_ID) {
  console.error('Missing SUBMITTALS_PROJECT_ID or SUBMITTALS_USER_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const projectId = Number(SUBMITTALS_PROJECT_ID);

async function seed() {
  // Seed submittal_types first to satisfy FK
  const typeName = 'Smoke Type';
  const { data: existingType, error: fetchTypeError } = await supabase
    .from('submittal_types')
    .select('id')
    .eq('name', typeName)
    .maybeSingle();
  if (fetchTypeError) throw new Error(`Error fetching submittal_types: ${fetchTypeError.message}`);

  const submittalTypeId = existingType?.id || '11111111-1111-1111-1111-111111111111';
  const { error: typeError } = await supabase.from('submittal_types').upsert(
    [
      {
        id: submittalTypeId,
        name: typeName,
        category: 'General',
        description: 'Smoke type for deterministic testing',
        required_documents: ['Spec Sheet'],
        review_criteria: { completeness: true },
      },
    ],
    { onConflict: 'id' }
  );
  if (typeError) throw new Error(`Error upserting submittal_types: ${typeError.message}`);

  const submittalNumber = 'SUB-SMOKE-001';
  const { data: existingSubmittal, error: fetchSubmittalError } = await supabase
    .from('submittals')
    .select('id')
    .eq('project_id', projectId)
    .eq('submittal_number', submittalNumber)
    .maybeSingle();
  if (fetchSubmittalError) throw new Error(`Error fetching submittals: ${fetchSubmittalError.message}`);

  const submittalId = existingSubmittal?.id || '22222222-2222-2222-2222-222222222222';
  const now = new Date().toISOString();

  const { error: submittalError } = await supabase.from('submittals').upsert(
    [
      {
        id: submittalId,
        project_id: projectId,
        specification_id: null,
        submittal_type_id: submittalTypeId,
        submittal_number: submittalNumber,
        title: 'Smoke Submittal 1',
        description: 'Deterministic record for smoke tests',
        submitted_by: SUBMITTALS_USER_ID,
        submitter_company: 'Smoke Co',
        submission_date: now,
        required_approval_date: null,
        priority: 'normal',
        status: 'submitted',
        current_version: 1,
        total_versions: 1,
        metadata: { seeded: true },
        created_at: now,
        updated_at: now,
      },
    ],
    { onConflict: 'id' }
  );
  if (submittalError) throw new Error(`Error upserting submittals: ${submittalError.message}`);

  const { error: docError } = await supabase.from('submittal_documents').upsert(
    [
      {
        id: '33333333-3333-3333-3333-333333333333',
        submittal_id: submittalId,
        document_name: 'Smoke Document',
        document_type: 'pdf',
        file_url: 'https://example.com/smoke.pdf',
        file_size_bytes: 1024,
        mime_type: 'application/pdf',
        page_count: 1,
        extracted_text: 'Smoke doc content',
        ai_analysis: { summary: 'Smoke' },
        version: 1,
        uploaded_at: now,
        uploaded_by: SUBMITTALS_USER_ID,
      },
    ],
    { onConflict: 'id' }
  );
  if (docError) throw new Error(`Error upserting submittal_documents: ${docError.message}`);

  const { count, error: countError } = await supabase
    .from('submittals')
    .select('id', { count: 'exact', head: true });
  if (countError) throw new Error(`Error verifying submittals count: ${countError.message}`);

  console.log('Submittals smoke seed completed. Submittals count:', count ?? 'unknown');
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
