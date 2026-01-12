/**
 * Test script for Change Events API
 * Run with: npm run test:api -- test-change-events
 */

const PROJECT_ID = 1;
const API_BASE = `http://localhost:3000/api/projects/${PROJECT_ID}/change-events`;

async function testChangeEventsAPI() {
  console.warn("🧪 Testing Change Events API...\n");

  let createdChangeEventId: number | null = null;
  let createdLineItemId: number | null = null;

  try {
    console.warn("📝 Test 1: Creating change event...");
    const createResponse = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Change Event - API Test",
        type: "owner_change",
        reason: "Design Development",
        scope: "out_of_scope",
        status: "open",
        origin: "field",
        expecting_revenue: true,
        line_item_revenue_source: "match_latest_cost",
        description: "This is a test change event created via API",
        notes: "Test notes",
        estimated_impact: 50000,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Create failed: ${error}`);
    }

    const createdEvent = await createResponse.json();
    createdChangeEventId = createdEvent.id;
    console.warn("✅ Change event created:", createdEvent);

    console.warn("\n📖 Test 2: Getting change event...");
    const getResponse = await fetch(`${API_BASE}/${createdChangeEventId}`);
    if (!getResponse.ok) {
      throw new Error(`Get failed: ${getResponse.statusText}`);
    }

    const retrievedEvent = await getResponse.json();
    console.warn("✅ Retrieved change event:", retrievedEvent);

    console.warn("\n➕ Test 3: Adding line item...");
    const lineItemResponse = await fetch(
      `${API_BASE}/${createdChangeEventId}/line-items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: "Test Line Item - Concrete Work",
          cost_code: "03-001",
          unit_of_measure: "CY",
          quantity: 100,
          unit_cost: 150,
          revenue_rom: 16500,
          cost_rom: 15000,
          non_committed_cost: 5000,
        }),
      },
    );

    if (!lineItemResponse.ok) {
      throw new Error(`Add line item failed: ${lineItemResponse.statusText}`);
    }

    const createdLineItem = await lineItemResponse.json();
    createdLineItemId = createdLineItem.id;
    console.warn("✅ Line item created:", createdLineItem);

    console.warn("\n✏️ Test 4: Updating change event...");
    const updateResponse = await fetch(`${API_BASE}/${createdChangeEventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Change Event - Updated",
        status: "pending_approval",
        estimated_impact: 75000,
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.statusText}`);
    }

    const updatedEvent = await updateResponse.json();
    console.warn("✅ Change event updated:", updatedEvent);

    console.warn("\n📋 Test 5: Listing change events...");
    const listResponse = await fetch(`${API_BASE}?status=pending_approval`);
    if (!listResponse.ok) {
      throw new Error(`List failed: ${listResponse.statusText}`);
    }

    const listResult = await listResponse.json();
    console.warn("✅ Listed change events:", listResult);

    console.warn("\n📜 Test 6: Getting change event history...");
    const historyResponse = await fetch(
      `${API_BASE}/${createdChangeEventId}/history`,
    );
    if (!historyResponse.ok) {
      throw new Error(`History failed: ${historyResponse.statusText}`);
    }

    const history = await historyResponse.json();
    console.warn("✅ Change event history:", history);

    console.warn("\n🎉 All tests passed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    if (createdChangeEventId) {
      console.warn("\n🧹 Cleaning up test data...");
      try {
        const deleteResponse = await fetch(
          `${API_BASE}/${createdChangeEventId}`,
          { method: "DELETE" },
        );
        if (deleteResponse.ok) {
          console.warn("✅ Test data cleaned up");
        } else {
          console.warn("⚠️ Failed to clean up test data");
        }
      } catch (cleanupError) {
        console.error("❌ Cleanup error:", cleanupError);
      }
    }

    if (createdLineItemId) {
      void createdLineItemId;
    }
  }
}

if (require.main === module) {
  testChangeEventsAPI().catch(console.error);
}

export { testChangeEventsAPI };
