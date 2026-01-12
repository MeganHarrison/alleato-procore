/**
 * Test script for Change Events API
 * Run with: npx tsx src/app/api/projects/[id]/change-events/test-api.ts
 */

const BASE_URL = "http://localhost:3000";
const PROJECT_ID = "1";

const testChangeEvent = {
  title: "Test Change Event - API Integration",
  type: "OWNER_CHANGE",
  reason: "Design Development",
  scope: "OUT_OF_SCOPE",
  origin: "FIELD",
  description: "This is a test change event created via API",
  expectingRevenue: true,
  lineItemRevenueSource: "MATCH_LATEST_COST",
};

const testLineItem = {
  description: "Test Line Item - Carpet Installation",
  unitOfMeasure: "SF",
  quantity: 500,
  unitCost: 15.5,
  costRom: 7750.0,
  sortOrder: 1,
};

async function getAuthToken(): Promise<string> {
  console.warn("⚠️ Please update the auth token in test-api.ts");
  return "YOUR_AUTH_TOKEN_HERE";
}

async function makeRequest(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return response;
}

async function testChangeEventsAPI() {
  console.warn("🧪 Testing Change Events API...\n");

  try {
    console.warn("1️⃣ Creating change event...");
    const createResponse = await makeRequest(
      `/api/projects/${PROJECT_ID}/change-events`,
      {
        method: "POST",
        body: JSON.stringify(testChangeEvent),
      },
    );

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Failed to create change event: ${JSON.stringify(error)}`);
    }

    const createdEvent = await createResponse.json();
    console.warn("✅ Change event created:", {
      id: createdEvent.id,
      number: createdEvent.number,
      title: createdEvent.title,
    });

    const changeEventId = createdEvent.id;

    console.warn("\n2️⃣ Fetching change event...");
    const getResponse = await makeRequest(
      `/api/projects/${PROJECT_ID}/change-events/${changeEventId}`,
    );

    if (!getResponse.ok) {
      throw new Error("Failed to fetch change event");
    }

    const fetchedEvent = await getResponse.json();
    console.warn("✅ Change event fetched:", {
      id: fetchedEvent.id,
      totals: fetchedEvent.totals,
    });

    console.warn("\n3️⃣ Updating change event...");
    const updateResponse = await makeRequest(
      `/api/projects/${PROJECT_ID}/change-events/${changeEventId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated Test Change Event",
          description: "Updated description via API",
        }),
      },
    );

    if (!updateResponse.ok) {
      throw new Error("Failed to update change event");
    }

    console.warn("✅ Change event updated");

    console.warn("\n4️⃣ Adding line item...");
    const lineItemResponse = await makeRequest(
      `/api/projects/${PROJECT_ID}/change-events/${changeEventId}/line-items`,
      {
        method: "POST",
        body: JSON.stringify(testLineItem),
      },
    );

    if (!lineItemResponse.ok) {
      const error = await lineItemResponse.json();
      throw new Error(`Failed to create line item: ${JSON.stringify(error)}`);
    }

    const createdLineItem = await lineItemResponse.json();
    console.warn("✅ Line item created:", {
      id: createdLineItem.id,
      description: createdLineItem.description,
      extendedAmount: createdLineItem.extendedAmount,
    });

    console.warn("\n5️⃣ Listing change events...");
    const listResponse = await makeRequest(
      `/api/projects/${PROJECT_ID}/change-events?limit=5&status=OPEN`,
    );

    if (!listResponse.ok) {
      throw new Error("Failed to list change events");
    }

    const list = await listResponse.json();
    console.warn("✅ Change events listed:", {
      count: list.data.length,
      totalRecords: list.pagination.totalRecords,
    });

    console.warn("\n6️⃣ Fetching history...");
    const historyResponse = await makeRequest(
      `/api/projects/${PROJECT_ID}/change-events/${changeEventId}/history`,
    );

    if (!historyResponse.ok) {
      throw new Error("Failed to fetch history");
    }

    const history = await historyResponse.json();
    console.warn("✅ History fetched:", {
      entries: history.data.length,
      latestAction: history.data[0]?.description || "No history",
    });

    console.warn("\n7️⃣ Cleaning up - deleting change event...");
    const deleteResponse = await makeRequest(
      `/api/projects/${PROJECT_ID}/change-events/${changeEventId}`,
      { method: "DELETE" },
    );

    if (!deleteResponse.ok && deleteResponse.status !== 204) {
      console.warn("⚠️ Failed to delete change event (might be due to status)");
    } else {
      console.warn("✅ Change event deleted");
    }

    console.warn("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

console.warn("====================================");
console.warn("Change Events API Integration Tests");
console.warn("====================================\n");

testChangeEventsAPI()
  .then(() => {
    console.warn("\n✅ Test suite completed");
  })
  .catch((error) => {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  });
