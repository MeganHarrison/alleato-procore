/** * Test script for Change Events API * Run with: npx tsx src/app/api/projects/[id]/change-events/test-api.ts */
const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = '1'; // Update with a valid project ID // Test data
const testChangeEvent = { title: 'Test Change Event - API Integration', type: 'OWNER_CHANGE', reason: 'Design Development', scope: 'OUT_OF_SCOPE', origin: 'FIELD', description: 'This is a test change event created via API', expectingRevenue: true, lineItemRevenueSource: 'MATCH_LATEST_COST',
};
const testLineItem = { description: 'Test Line Item - Carpet Installation', unitOfMeasure: 'SF', quantity: 500, unitCost: 15.50, costRom: 7750.00, sortOrder: 1,
}; async
function getAuthToken(): Promise<string> { // In a real test, you'd get this from your auth system // For now, you need to manually get a token from your browser session console.warn('⚠️ Please update the auth token in test-api.ts');
return 'YOUR_AUTH_TOKEN_HERE';
}
async
function makeRequest( path: string, options: RequestInit = {}
): Promise<Response> {
const token = await getAuthToken();
const response = await fetch(`${BASE_URL}${path}`, { ...options, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers, }, });
return response;
}
async
function testChangeEventsAPI() { console.log('🧪 Testing Change Events API...\n');
try { // 1. Create a change event console.log('1️⃣ Creating change event...');
const createResponse = await makeRequest( `/api/projects/${PROJECT_ID}/change-events`, { method: 'POST', body: JSON.stringify(testChangeEvent), } );
if (!createResponse.ok) {
const error = await createResponse.json();
throw new Error(`Failed to create change event: ${JSON.stringify(error)}`); }
const createdEvent = await createResponse.json(); console.log('✅ Change event created:', { id: createdEvent.id, number: createdEvent.number, title: createdEvent.title, });
const changeEventId = createdEvent.id; // 2. Get the change event console.log('\n2️⃣ Fetching change event...');
const getResponse = await makeRequest( `/api/projects/${PROJECT_ID}/change-events/${changeEventId}` );
if (!getResponse.ok) {
throw new Error('Failed to fetch change event'); }
const fetchedEvent = await getResponse.json(); console.log('✅ Change event fetched:', { id: fetchedEvent.id, totals: fetchedEvent.totals, }); // 3. Update the change event console.log('\n3️⃣ Updating change event...');
const updateResponse = await makeRequest( `/api/projects/${PROJECT_ID}/change-events/${changeEventId}`, { method: 'PUT', body: JSON.stringify({ title: 'Updated Test Change Event', description: 'Updated description via API', }), } );
if (!updateResponse.ok) {
throw new Error('Failed to update change event'); } console.log('✅ Change event updated'); // 4. Add a line item console.log('\n4️⃣ Adding line item...');
const lineItemResponse = await makeRequest( `/api/projects/${PROJECT_ID}/change-events/${changeEventId}/line-items`, { method: 'POST', body: JSON.stringify(testLineItem), } );
if (!lineItemResponse.ok) {
const error = await lineItemResponse.json();
throw new Error(`Failed to create line item: ${JSON.stringify(error)}`); }
const createdLineItem = await lineItemResponse.json(); console.log('✅ Line item created:', { id: createdLineItem.id, description: createdLineItem.description, extendedAmount: createdLineItem.extendedAmount, }); // 5. List change events console.log('\n5️⃣ Listing change events...');
const listResponse = await makeRequest( `/api/projects/${PROJECT_ID}/change-events?limit=5&status=OPEN` );
if (!listResponse.ok) {
throw new Error('Failed to list change events'); }
const list = await listResponse.json(); console.log('✅ Change events listed:', { count: list.data.length, totalRecords: list.pagination.totalRecords, }); // 6. Get history console.log('\n6️⃣ Fetching history...');
const historyResponse = await makeRequest( `/api/projects/${PROJECT_ID}/change-events/${changeEventId}/history` );
if (!historyResponse.ok) {
throw new Error('Failed to fetch history'); }
const history = await historyResponse.json(); console.log('✅ History fetched:', { entries: history.data.length, latestAction: history.data[0]?.description || 'No history', }); // 7. Clean up - Delete the change event console.log('\n7️⃣ Cleaning up - deleting change event...');
const deleteResponse = await makeRequest( `/api/projects/${PROJECT_ID}/change-events/${changeEventId}`, { method: 'DELETE', } );
if (!deleteResponse.ok && deleteResponse.status !== 204) { console.warn('⚠️ Failed to delete change event (might be due to status)'); }
else console.log('✅ Change event deleted'); } console.log('\n🎉 All tests completed successfully!'); } catch error) { console.error('\n❌ Test failed:', error); process.exit(1); }
} // Run the tests
console.log('====================================');
console.log('Change Events API Integration Tests');
console.log('====================================\n'); testChangeEventsAPI() .then(() => { console.log('\n✅ Test suite completed'); }) .catch((error) => { console.error('\n❌ Test suite failed:', error); process.exit(1); });