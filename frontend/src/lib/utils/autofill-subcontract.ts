import type { CreateSubcontractInput, SovLineItem } from '@/lib/schemas/create-subcontract-schema';

/**
 * Generate realistic autofill data for subcontract form testing
 */
export function generateAutofillData(): CreateSubcontractInput & { sovLines?: SovLineItem[] } {
  const today = new Date();
  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 7); // Start in 7 days

  const completionDate = new Date(startDate);
  completionDate.setMonth(completionDate.getMonth() + 6); // 6 months duration

  const contractDate = new Date(today);
  contractDate.setDate(today.getDate() - 3); // Signed 3 days ago

  const sovLines: SovLineItem[] = [
    {
      lineNumber: 1,
      changeEventLineItem: '',
      budgetCode: '01-100',
      description: 'Site Preparation and Earthwork',
      amount: 125000,
      billedToDate: 0,
    },
    {
      lineNumber: 2,
      changeEventLineItem: '',
      budgetCode: '03-300',
      description: 'Concrete Foundation and Slab',
      amount: 245000,
      billedToDate: 0,
    },
    {
      lineNumber: 3,
      changeEventLineItem: '',
      budgetCode: '05-500',
      description: 'Structural Steel Framing',
      amount: 380000,
      billedToDate: 0,
    },
    {
      lineNumber: 4,
      changeEventLineItem: '',
      budgetCode: '06-100',
      description: 'Rough Carpentry',
      amount: 95000,
      billedToDate: 0,
    },
    {
      lineNumber: 5,
      changeEventLineItem: '',
      budgetCode: '09-200',
      description: 'Drywall and Finishes',
      amount: 175000,
      billedToDate: 0,
    },
  ];

  return {
    contractNumber: 'SC-2025-001',
    // contractCompanyId intentionally left empty - user must select from real companies
    contractCompanyId: undefined,
    title: 'General Construction Services - Phase 1',
    status: 'Draft',
    executed: false,
    defaultRetainagePercent: 10,
    description: 'Comprehensive construction services including site preparation, foundation work, structural framing, and interior finishes for the new commercial building project.',
    sov: sovLines,
    sovLines, // Also include as separate property for form state
    inclusions: `• All labor, materials, and equipment as specified in construction documents
• Site mobilization and demobilization
• Temporary site facilities and utilities
• Project management and supervision
• Quality control and safety compliance
• Cleanup and waste removal`,
    exclusions: `• Architectural and engineering design services
• Building permits and inspection fees
• Off-site utility connections
• Landscaping and site improvements beyond building footprint
• Owner-furnished equipment and materials
• Extended warranty coverage beyond standard terms`,
    dates: {
      startDate: formatDate(startDate),
      estimatedCompletionDate: formatDate(completionDate),
      actualCompletionDate: undefined,
      contractDate: formatDate(contractDate),
      signedContractReceivedDate: formatDate(contractDate),
      issuedOnDate: formatDate(today),
    },
    privacy: {
      isPrivate: true,
      allowNonAdminViewSovItems: false,
    },
  };
}
