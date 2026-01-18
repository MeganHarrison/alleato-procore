import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return adminClient;
}

export async function fetchChangeEventById(changeEventId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('change_events')
    .select('*')
    .eq('id', changeEventId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch change event: ${error.message}`);
  }

  return data;
}

export async function fetchChangeEventByNumber(projectId: number, number: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('change_events')
    .select('*')
    .eq('project_id', projectId)
    .eq('number', number)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch change event by number: ${error.message}`);
  }

  return data;
}

export async function countChangeEvents(projectId: number) {
  const supabase = getAdminClient();
  const { count, error } = await supabase
    .from('change_events')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) {
    throw new Error(`Failed to count change events: ${error.message}`);
  }

  return count ?? 0;
}

export async function fetchLineItems(changeEventId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('change_event_line_items')
    .select('*')
    .eq('change_event_id', changeEventId);

  if (error) {
    throw new Error(`Failed to fetch line items: ${error.message}`);
  }

  return data ?? [];
}
