import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupTestUserForAllProjects() {
  const testUserId = 'd995c8a8-d839-498a-8d32-4affa72f2dc5';

  console.log('Setting up test user for all projects...\n');

  // Get first 5 projects for testing
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .limit(5);

  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    return;
  }

  if (!projects || projects.length === 0) {
    console.error('No projects found');
    return;
  }

  console.log(`Found ${projects.length} projects\n`);

  for (const project of projects) {
    console.log(`Project ${project.id}: ${project.name}`);

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('access')
      .eq('project_id', project.id)
      .eq('user_id', testUserId)
      .single();

    if (existingMember) {
      console.log(`  Current access: ${existingMember.access}`);

      if (existingMember.access !== 'admin') {
        // Update to admin
        const { error: updateError } = await supabase
          .from('project_members')
          .update({ access: 'admin' })
          .eq('project_id', project.id)
          .eq('user_id', testUserId);

        if (updateError) {
          console.error(`  ❌ Error updating: ${updateError.message}`);
        } else {
          console.log(`  ✓ Updated to admin`);
        }
      } else {
        console.log(`  ✓ Already admin`);
      }
    } else {
      // Create new membership
      const { error: insertError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: testUserId,
          access: 'admin',
        });

      if (insertError) {
        console.error(`  ❌ Error creating membership: ${insertError.message}`);
      } else {
        console.log(`  ✓ Created admin membership`);
      }
    }
  }

  console.log('\n✓ Done!');
}

setupTestUserForAllProjects();
