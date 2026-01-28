import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lgveqfnpkxvzbnnwuled.supabase.co',
  'sb_publishable_ecZLO3VnRlZEGEuwBOP6jg_DP3LZQ_F'
);

async function main() {
  // Check procore_features
  const { data: features, error: featErr } = await supabase
    .from('procore_features')
    .select('*')
    .limit(1);

  if (featErr) {
    console.log('procore_features: ERROR -', featErr.message);
  } else {
    const cols = features && features.length > 0 ? Object.keys(features[0]) : [];
    console.log('procore_features: EXISTS');
    console.log('  Columns:', cols.join(', '));
  }

  // Check procore_pages
  const { data: pages, error: pageErr } = await supabase
    .from('procore_pages')
    .select('*')
    .limit(1);

  if (pageErr) {
    console.log('procore_pages: ERROR -', pageErr.message);
  } else {
    console.log('procore_pages: EXISTS');
  }
}

main();
