import { CompanyService } from "../companyService";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
const createMockSupabase = () => {
  const mockSupabase = {
    from: jest.fn(),
    rpc: jest.fn(),
  } as unknown as SupabaseClient;

  return mockSupabase;
};

describe("CompanyService", () => {
  let service: CompanyService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new CompanyService(mockSupabase);
  });

  describe("getCompanies", () => {
    // Helper to create a chainable query mock
    const createChainableMock = (resolvedValue: {
      data: unknown;
      error: unknown;
      count?: number;
    }) => {
      const chainable: Record<string, jest.Mock> = {};
      const methods = [
        "select",
        "eq",
        "order",
        "range",
        "ilike",
        "or",
        "single",
      ];

      methods.forEach((method) => {
        chainable[method] = jest.fn().mockImplementation(() => {
          // Return the chainable for most methods
          return {
            ...chainable,
            then: (resolve: (value: unknown) => void) => resolve(resolvedValue),
          };
        });
      });

      // Make the mock itself awaitable
      Object.assign(chainable, {
        then: (resolve: (value: unknown) => void) => resolve(resolvedValue),
      });

      return chainable;
    };

    it("should return paginated list of companies", async () => {
      const mockData = [
        {
          id: "pc-1",
          project_id: 1,
          company_id: "comp-1",
          company_type: "VENDOR",
          status: "ACTIVE",
          company: { id: "comp-1", name: "Test Company 1" },
        },
        {
          id: "pc-2",
          project_id: 1,
          company_id: "comp-2",
          company_type: "SUBCONTRACTOR",
          status: "ACTIVE",
          company: { id: "comp-2", name: "Test Company 2" },
        },
      ];

      const chainable = createChainableMock({
        data: mockData,
        error: null,
        count: 2,
      });
      const mockFrom = jest.fn().mockReturnValue(chainable);

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      // Mock getCompanyUserCount to return 0
      jest
        .spyOn(service as never, "getCompanyUserCount")
        .mockResolvedValue(0 as never);

      const result = await service.getCompanies("1", { page: 1, per_page: 25 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.current_page).toBe(1);
      expect(result.pagination.per_page).toBe(25);
    });

    it("should filter by status", async () => {
      const chainable = createChainableMock({
        data: [],
        error: null,
        count: 0,
      });
      const mockFrom = jest.fn().mockReturnValue(chainable);

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      await service.getCompanies("1", { status: "INACTIVE" });

      expect(mockFrom).toHaveBeenCalledWith("project_companies");
    });

    it("should filter by company_type", async () => {
      const chainable = createChainableMock({
        data: [],
        error: null,
        count: 0,
      });
      const mockFrom = jest.fn().mockReturnValue(chainable);

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      await service.getCompanies("1", { company_type: "VENDOR" });

      expect(mockFrom).toHaveBeenCalled();
    });

    it("should apply search filter", async () => {
      const mockData = [
        {
          id: "pc-1",
          company_id: "comp-1",
          company: { name: "Acme Corporation" },
          email_address: "contact@acme.com",
          business_phone: null,
        },
        {
          id: "pc-2",
          company_id: "comp-2",
          company: { name: "Beta Inc" },
          email_address: "beta@test.com",
          business_phone: null,
        },
      ];

      const chainable = createChainableMock({
        data: mockData,
        error: null,
        count: 2,
      });
      const mockFrom = jest.fn().mockReturnValue(chainable);

      (mockSupabase.from as typeof mockFrom) = mockFrom;
      jest
        .spyOn(service as never, "getCompanyUserCount")
        .mockResolvedValue(0 as never);

      const result = await service.getCompanies("1", { search: "Acme" });

      expect(result.data.length).toBe(1);
      expect(result.data[0].company?.name).toBe("Acme Corporation");
    });
  });

  describe("getCompany", () => {
    it("should return single company with details", async () => {
      const mockCompanyData = {
        id: "pc-1",
        project_id: 1,
        company_id: "comp-1",
        primary_contact_id: "person-1",
        company_type: "VENDOR",
        status: "ACTIVE",
        company: { id: "comp-1", name: "Test Company" },
      };

      const mockContact = {
        id: "person-1",
        first_name: "John",
        last_name: "Doe",
      };

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === "project_companies") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockCompanyData,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "people") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockContact,
                  error: null,
                }),
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      const result = await service.getCompany("1", "pc-1");

      expect(result.id).toBe("pc-1");
      expect(result.primary_contact?.id).toBe("person-1");
    });

    it("should throw RESOURCE_NOT_FOUND error for non-existent company", async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116", message: "Row not found" },
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      await expect(service.getCompany("1", "non-existent")).rejects.toThrow(
        "Company with ID non-existent not found.",
      );
    });
  });

  describe("createCompany", () => {
    it("should create company and project association", async () => {
      const mockGlobalCompany = {
        id: "global-comp-1",
        name: "New Company",
      };

      const mockProjectCompany = {
        id: "pc-1",
        project_id: 1,
        company_id: "global-comp-1",
        company_type: "VENDOR",
        status: "ACTIVE",
        company: mockGlobalCompany,
      };

      const insertCalls: string[] = [];

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        insertCalls.push(table);
        if (table === "companies") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockGlobalCompany,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_companies") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockProjectCompany,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      const result = await service.createCompany("1", {
        name: "New Company",
        company_type: "VENDOR",
      });

      expect(result.id).toBe("pc-1");
      expect(result.user_count).toBe(0);
      expect(insertCalls).toContain("companies");
      expect(insertCalls).toContain("project_companies");
    });

    it("should set default company_type to VENDOR", async () => {
      const mockGlobalCompany = { id: "comp-1", name: "Test" };
      const mockProjectCompany = {
        id: "pc-1",
        company_type: "VENDOR",
        company: mockGlobalCompany,
      };

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === "companies") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockGlobalCompany,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_companies") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockProjectCompany,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      const result = await service.createCompany("1", { name: "Test Company" });

      expect(result.company_type).toBe("VENDOR");
    });
  });

  describe("updateCompany", () => {
    it("should update both global and project-specific fields", async () => {
      const updateCalls: { table: string; fields: Record<string, unknown> }[] =
        [];

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === "project_companies") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { company_id: "comp-1", id: "pc-1" },
                  error: null,
                }),
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: "pc-1",
                      company: { id: "comp-1", name: "Updated Name" },
                    },
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockImplementation((fields) => {
              updateCalls.push({ table, fields });
              return {
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
              };
            }),
          };
        }
        if (table === "companies") {
          return {
            update: jest.fn().mockImplementation((fields) => {
              updateCalls.push({ table, fields });
              return {
                eq: jest.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        if (table === "people") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: null, error: null }),
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      await service.updateCompany("1", "pc-1", {
        name: "Updated Name",
        business_phone: "555-1234",
      });

      expect(updateCalls.some((c) => c.table === "companies")).toBe(true);
      expect(updateCalls.some((c) => c.table === "project_companies")).toBe(
        true,
      );
    });
  });

  describe("canDeleteCompany", () => {
    it("should return canDelete: true when no users assigned", async () => {
      jest
        .spyOn(service as never, "getCompanyUserCount")
        .mockResolvedValue(0 as never);

      const result = await service.canDeleteCompany("1", "pc-1");

      expect(result.canDelete).toBe(true);
    });

    it("should return canDelete: false when users are assigned", async () => {
      jest
        .spyOn(service as never, "getCompanyUserCount")
        .mockResolvedValue(5 as never);

      const result = await service.canDeleteCompany("1", "pc-1");

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("5 users");
    });
  });

  describe("canRemoveContact", () => {
    it("should return canRemove: false for primary contact", async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { primary_contact_id: "person-1" },
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      const result = await service.canRemoveContact("1", "comp-1", "person-1");

      expect(result.canRemove).toBe(false);
      expect(result.reason).toContain("primary contact");
    });

    it("should return canRemove: true for non-primary contact", async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { primary_contact_id: "person-2" },
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      const result = await service.canRemoveContact("1", "comp-1", "person-1");

      expect(result.canRemove).toBe(true);
    });
  });

  describe("setPrimaryContact", () => {
    it("should update primary contact when person belongs to company", async () => {
      const updateCalled = jest.fn();

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === "people") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { company_id: "comp-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_companies") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { company_id: "comp-1" },
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockImplementation(() => {
              updateCalled();
              return {
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
              };
            }),
          };
        }
        return {};
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      await service.setPrimaryContact("1", "pc-1", "person-1");

      expect(updateCalled).toHaveBeenCalled();
    });

    it("should throw error when person does not belong to company", async () => {
      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === "people") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { company_id: "different-comp" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_companies") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { company_id: "comp-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      await expect(
        service.setPrimaryContact("1", "pc-1", "person-1"),
      ).rejects.toThrow("Person does not belong to this company");
    });
  });

  describe("getCompanyUsers", () => {
    it("should return users for company in project", async () => {
      const mockUsers = [
        { id: "person-1", first_name: "John", last_name: "Doe" },
        { id: "person-2", first_name: "Jane", last_name: "Smith" },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockUsers,
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as typeof mockFrom) = mockFrom;

      const result = await service.getCompanyUsers("1", "comp-1");

      expect(result).toHaveLength(2);
      expect(result[0].first_name).toBe("John");
    });
  });
});
