import { createClient } from '@/lib/supabase/server'; /** * Test script for Change Events API * Run with: npm run test:api -- test-change-events */
const PROJECT_ID = 1; // Test project ID
const API_BASE = `http://localhost:3000/api/projects/${PROJECT_ID}/change-events`; async
function testChangeEventsAPI() { console.log('🧪 Testing Change Events API...\n');
let createdChangeEventId: number | null = null;
let createdLineItemId: number | null = null;
try { // Test 1: Create Change Event console.log('📝 Test 1: Creating change event...');
const createResponse = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json', // Add auth header
if needed }, body: JSON.stringify({ title: 'Test Change Event - API Test', type: 'owner_change', reason: 'Design Development', scope: 'out_of_scope', status: 'open', origin: 'field', expecting_revenue: true, line_item_revenue_source: 'match_latest_cost', description: 'This is a test change event created via API', notes: 'Test notes', estimated_impact: 50000 }) });
if (!createResponse.ok) {
const error = await createResponse.text();
throw new Error(`Create failed: ${error}`); }
const createdEvent = await createResponse.json(); createdChangeEventId = createdEvent.id; console.log('✅ Change event created:', createdEvent); // Test 2: Get Change Event console.log('\n📖 Test 2: Getting change event...');
const getResponse = await fetch(`${API_BASE}/${createdChangeEventId}`);
if (!getResponse.ok) {
throw new Error(`Get failed: ${getResponse.statusText}`); }
const retrievedEvent = await getResponse.json(); console.log('✅ Retrieved change event:', retrievedEvent); // Test 3: Add Line Item console.log('\n➕ Test 3: Adding line item...');
const lineItemResponse = await fetch(`${API_BASE}/${createdChangeEventId}/line-items`, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ description: 'Test Line Item - Concrete Work', cost_code: '03-001', unit_of_measure: 'CY', quantity: 100, unit_cost: 150, revenue_rom: 16500, cost_rom: 15000, non_committed_cost: 5000 }) });
if (!lineItemResponse.ok) {
throw new Error(`Add line item failed: ${lineItemResponse.statusText}`); }
const createdLineItem = await lineItemResponse.json(); createdLineItemId = createdLineItem.id; console.log('✅ Line item created:', createdLineItem); // Test 4: Update Change Event console.log('\n✏️ Test 4: Updating change event...');
const updateResponse = await fetch(`${API_BASE}/${createdChangeEventId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ title: 'Test Change Event - Updated', status: 'pending_approval', estimated_impact: 75000 }) });
if (!updateResponse.ok) {
throw new Error(`Update failed: ${updateResponse.statusText}`); }
const updatedEvent = await updateResponse.json(); console.log('✅ Change event updated:', updatedEvent); // Test 5: List Change Events console.log('\n📋 Test 5: Listing change events...');
const listResponse = await fetch(`${API_BASE}?status=pending_approval`);
if (!listResponse.ok) {
throw new Error(`List failed: ${listResponse.statusText}`); }
const listResult = await listResponse.json(); console.log('✅ Listed change events:', listResult); // Test 6: Get History console.log('\n📜 Test 6: Getting change event history...');
const historyResponse = await fetch(`${API_BASE}/${createdChangeEventId}/history`);
if (!historyResponse.ok) {
throw new Error(`History failed: ${historyResponse.statusText}`); }
const history = await historyResponse.json(); console.log('✅ Change event history:', history); console.log('\n🎉 All tests passed successfully!'); } catch error) { console.error('\n❌ Test failed:', error); } finally  // Cleanup: Delete test data
if (createdChangeEventId) { console.log('\n🧹 Cleaning up test data...');
try {
const deleteResponse = await fetch(`${API_BASE}/${createdChangeEventId}`, { method: 'DELETE' });
if (deleteResponse.ok) { console.log('✅ Test data cleaned up'); }
else console.log('⚠️ Failed to clean up test data'); } } catch cleanupError) { console.error('❌ Cleanup error:', cleanupError); } } }
} // Run the test
if (require.main === module) { testChangeEventsAPI().catch(console.error);
}
export { testChangeEventsAPI };