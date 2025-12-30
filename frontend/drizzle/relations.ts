import { relations } from "drizzle-orm/relations";
import { costCodes, projectBudgetCodes, costCodeTypes, projects, subJobs, users, billingPeriods, nodsPage, projectTasks, documents, chunks, fmGlobalTables, fmTableVectors, documentMetadata, meetingSegments, employees, fmFormSubmissions, fmOptimizationSuggestions, userProjects, designRecommendations, chatSessions, issues, subcontractors, subcontractorProjects, fmGlobalFigures, notes, fmSections, asrsSections, fmBlocks, asrsProtectionRules, asrsBlocks, blockEmbeddings, projectMembers, projectUsers, specifications, companies, contacts, chatHistory, budgetLines, budgetLineHistory, contractPayments, contractBillingPeriods, primeContracts, risks, submittals, submittalTypes, projectResources, submittalDocuments, files, userProfiles, requests, asrsLogicCards, discrepancies, tasks, reviews, reviewComments, profiles, aiAnalysisJobs, nodsPageSection, submittalHistory, submittalNotifications, chatMessages, vendors, contractViews, contractSnapshots, contractDocuments, submittalAnalyticsEvents, submittalPerformanceMetrics, projectBriefings, budgetModificationLines, budgetModifications, commitmentLines, commitments, briefingRuns, clients, subcontractorContacts, subcontractorDocuments, prospects, appUsers, fmSprinklerConfigs, commitmentChangeOrderLines, commitmentChangeOrders, qtoItems, qtos, changeOrders, changeOrderCosts, changeOrderApprovals, attachments, scheduleTasks, scheduleTaskDependencies, scheduleResources, scheduleProgressUpdates, decisions, opportunities, procoreCaptureSessions, procoreScreenshots, firefliesIngestionJobs, project, groups, procoreComponents, sources, crawledPages, procoreModules, procoreFeatures, directCosts, commitmentChanges, codeExamples, erpSyncLog, contracts, primeContractSovs, changeEvents, primePotentialChangeOrders, changeEventLineItems, pcoLineItems, primeContractChangeOrders, pccoLineItems, ownerInvoices, ownerInvoiceLineItems, paymentTransactions, conversations, messages, documentRows, projectInsights, chatThreads, chatThreadItems, chatThreadAttachments, chatThreadFeedback, chatThreadAttachmentFiles, rfis, documentInsights, aiTasks, ingestionJobs, aiInsights, dailyLogs, dailyLogEquipment, dailyLogManpower, dailyLogNotes, costForecasts, directCostLineItems, forecastingCurves, financialContracts, scheduleOfValues, todos, sovLineItems, verticalMarkup, costCodeDivisions, projectCostCodes, subcontracts, subcontractSovItems, projectDirectory, subcontractAttachments, budgetViews, budgetViewColumns, contractLineItems, changeOrderLines, budgetModLines, contractChangeOrders, groupMembers, documentUserAccess, documentGroupAccess, rfiAssignees } from "./schema";

export const projectBudgetCodesRelations = relations(projectBudgetCodes, ({one, many}) => ({
	costCode: one(costCodes, {
		fields: [projectBudgetCodes.costCodeId],
		references: [costCodes.id]
	}),
	costCodeType: one(costCodeTypes, {
		fields: [projectBudgetCodes.costTypeId],
		references: [costCodeTypes.id]
	}),
	user: one(users, {
		fields: [projectBudgetCodes.createdBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [projectBudgetCodes.projectId],
		references: [projects.id]
	}),
	subJob: one(subJobs, {
		fields: [projectBudgetCodes.subJobId],
		references: [subJobs.id]
	}),
	budgetLines: many(budgetLines),
}));

export const costCodesRelations = relations(costCodes, ({one, many}) => ({
	projectBudgetCodes: many(projectBudgetCodes),
	commitmentLines: many(commitmentLines),
	commitmentChangeOrderLines: many(commitmentChangeOrderLines),
	directCostLineItems: many(directCostLineItems),
	costCodeDivision: one(costCodeDivisions, {
		fields: [costCodes.divisionId],
		references: [costCodeDivisions.id]
	}),
	projectCostCodes: many(projectCostCodes),
	changeOrderLines: many(changeOrderLines),
	budgetModLines: many(budgetModLines),
	budgetLines: many(budgetLines),
}));

export const costCodeTypesRelations = relations(costCodeTypes, ({many}) => ({
	projectBudgetCodes: many(projectBudgetCodes),
	commitmentLines: many(commitmentLines),
	commitmentChangeOrderLines: many(commitmentChangeOrderLines),
	projectCostCodes: many(projectCostCodes),
	changeOrderLines: many(changeOrderLines),
	budgetModLines: many(budgetModLines),
	budgetLines: many(budgetLines),
}));

export const usersRelations = relations(users, ({many}) => ({
	projectBudgetCodes: many(projectBudgetCodes),
	chatSessions: many(chatSessions),
	chatHistories: many(chatHistory),
	budgetLineHistories: many(budgetLineHistory),
	contractPayments: many(contractPayments),
	userProfiles: many(userProfiles),
	profiles: many(profiles),
	contractViews: many(contractViews),
	contractSnapshots: many(contractSnapshots),
	contractDocuments: many(contractDocuments),
	commitmentChangeOrders_approvedBy: many(commitmentChangeOrders, {
		relationName: "commitmentChangeOrders_approvedBy_users_id"
	}),
	commitmentChangeOrders_requestedBy: many(commitmentChangeOrders, {
		relationName: "commitmentChangeOrders_requestedBy_users_id"
	}),
	groups: many(groups),
	directCostLineItems_approvedBy: many(directCostLineItems, {
		relationName: "directCostLineItems_approvedBy_users_id"
	}),
	directCostLineItems_createdBy: many(directCostLineItems, {
		relationName: "directCostLineItems_createdBy_users_id"
	}),
	forecastingCurves_createdBy: many(forecastingCurves, {
		relationName: "forecastingCurves_createdBy_users_id"
	}),
	forecastingCurves_updatedBy: many(forecastingCurves, {
		relationName: "forecastingCurves_updatedBy_users_id"
	}),
	financialContracts: many(financialContracts),
	todos: many(todos),
	subcontracts: many(subcontracts),
	primeContracts: many(primeContracts),
	subcontractAttachments: many(subcontractAttachments),
	budgetViews: many(budgetViews),
	budgetLines_createdBy: many(budgetLines, {
		relationName: "budgetLines_createdBy_users_id"
	}),
	budgetLines_updatedBy: many(budgetLines, {
		relationName: "budgetLines_updatedBy_users_id"
	}),
	budgetModifications: many(budgetModifications),
	contractChangeOrders_approvedBy: many(contractChangeOrders, {
		relationName: "contractChangeOrders_approvedBy_users_id"
	}),
	contractChangeOrders_requestedBy: many(contractChangeOrders, {
		relationName: "contractChangeOrders_requestedBy_users_id"
	}),
	groupMembers: many(groupMembers),
	documentUserAccesses: many(documentUserAccess),
	billingPeriods: many(billingPeriods),
	projectUsers: many(projectUsers),
	submittals: many(submittals),
	submittalDocuments: many(submittalDocuments),
	reviews: many(reviews),
	reviewComments: many(reviewComments),
	submittalHistories: many(submittalHistory),
	submittalNotifications: many(submittalNotifications),
	submittalAnalyticsEvents: many(submittalAnalyticsEvents),
	dailyLogs: many(dailyLogs),
	costForecasts: many(costForecasts),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	projectBudgetCodes: many(projectBudgetCodes),
	billingPeriods: many(billingPeriods),
	projectTasks: many(projectTasks),
	issues: many(issues),
	notes: many(notes),
	projectMembers: many(projectMembers),
	projectUsers: many(projectUsers),
	specifications: many(specifications),
	budgetLineHistories: many(budgetLineHistory),
	submittals: many(submittals),
	projectResources: many(projectResources),
	files: many(files),
	tasks: many(tasks),
	submittalNotifications: many(submittalNotifications),
	submittalAnalyticsEvents: many(submittalAnalyticsEvents),
	documents: many(documents),
	submittalPerformanceMetrics: many(submittalPerformanceMetrics),
	projectBriefings: many(projectBriefings),
	appUser: one(appUsers, {
		fields: [projects.budgetLockedBy],
		references: [appUsers.id]
	}),
	client: one(clients, {
		fields: [projects.clientId],
		references: [clients.id]
	}),
	employee: one(employees, {
		fields: [projects.projectManager],
		references: [employees.id]
	}),
	qtoItems: many(qtoItems),
	changeOrders: many(changeOrders),
	qtos: many(qtos),
	attachments: many(attachments),
	scheduleTasks: many(scheduleTasks),
	prospects: many(prospects),
	directCosts: many(directCosts),
	erpSyncLogs: many(erpSyncLog),
	primePotentialChangeOrders: many(primePotentialChangeOrders),
	changeEvents: many(changeEvents),
	documentMetadata: many(documentMetadata),
	projectInsights: many(projectInsights),
	rfis: many(rfis),
	aiTasks: many(aiTasks),
	dailyLogs: many(dailyLogs),
	subJobs: many(subJobs),
	directCostLineItems: many(directCostLineItems),
	financialContracts: many(financialContracts),
	verticalMarkups: many(verticalMarkup),
	contracts: many(contracts),
	projectCostCodes: many(projectCostCodes),
	commitments: many(commitments),
	subcontracts: many(subcontracts),
	projectDirectories: many(projectDirectory),
	primeContracts: many(primeContracts),
	budgetViews: many(budgetViews),
	changeOrderLines: many(changeOrderLines),
	budgetModLines: many(budgetModLines),
	budgetLines: many(budgetLines),
	budgetModifications: many(budgetModifications),
}));

export const subJobsRelations = relations(subJobs, ({one, many}) => ({
	projectBudgetCodes: many(projectBudgetCodes),
	project: one(projects, {
		fields: [subJobs.projectId],
		references: [projects.id]
	}),
	changeOrderLines: many(changeOrderLines),
	budgetModLines: many(budgetModLines),
	budgetLines: many(budgetLines),
}));

export const billingPeriodsRelations = relations(billingPeriods, ({one, many}) => ({
	user: one(users, {
		fields: [billingPeriods.closedBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [billingPeriods.projectId],
		references: [projects.id]
	}),
	ownerInvoices: many(ownerInvoices),
}));


export const nodsPageRelations = relations(nodsPage, ({one, many}) => ({
	nodsPage: one(nodsPage, {
		fields: [nodsPage.parentPageId],
		references: [nodsPage.id],
		relationName: "nodsPage_parentPageId_nodsPage_id"
	}),
	nodsPages: many(nodsPage, {
		relationName: "nodsPage_parentPageId_nodsPage_id"
	}),
	nodsPageSections: many(nodsPageSection),
}));

export const projectTasksRelations = relations(projectTasks, ({one}) => ({
	project: one(projects, {
		fields: [projectTasks.projectId],
		references: [projects.id]
	}),
}));

export const chunksRelations = relations(chunks, ({one, many}) => ({
	document: one(documents, {
		fields: [chunks.documentId],
		references: [documents.id]
	}),
	aiInsights: many(aiInsights),
}));

export const documentsRelations = relations(documents, ({one, many}) => ({
	chunks: many(chunks),
	risks: many(risks),
	tasks: many(tasks),
	documentMetadatum: one(documentMetadata, {
		fields: [documents.fileId],
		references: [documentMetadata.id]
	}),
	project: one(projects, {
		fields: [documents.projectId],
		references: [projects.id]
	}),
	decisions: many(decisions),
	opportunities: many(opportunities),
}));

export const fmTableVectorsRelations = relations(fmTableVectors, ({one}) => ({
	fmGlobalTable: one(fmGlobalTables, {
		fields: [fmTableVectors.tableId],
		references: [fmGlobalTables.tableId]
	}),
}));

export const fmGlobalTablesRelations = relations(fmGlobalTables, ({one, many}) => ({
	fmTableVectors: many(fmTableVectors),
	fmGlobalFigure: one(fmGlobalFigures, {
		fields: [fmGlobalTables.figures],
		references: [fmGlobalFigures.id]
	}),
	fmSprinklerConfigs: many(fmSprinklerConfigs),
}));

export const meetingSegmentsRelations = relations(meetingSegments, ({one, many}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [meetingSegments.metadataId],
		references: [documentMetadata.id]
	}),
	risks: many(risks),
	tasks: many(tasks),
	decisions: many(decisions),
	opportunities: many(opportunities),
}));

export const documentMetadataRelations = relations(documentMetadata, ({one, many}) => ({
	meetingSegments: many(meetingSegments),
	risks: many(risks),
	tasks: many(tasks),
	documents: many(documents),
	decisions: many(decisions),
	opportunities: many(opportunities),
	firefliesIngestionJobs: many(firefliesIngestionJobs),
	project: one(projects, {
		fields: [documentMetadata.projectId],
		references: [projects.id]
	}),
	documentRows: many(documentRows),
	documentInsights: many(documentInsights),
	aiTasks: many(aiTasks),
	ingestionJobs: many(ingestionJobs),
	documentUserAccesses: many(documentUserAccess),
	documentGroupAccesses: many(documentGroupAccess),
}));

export const employeesRelations = relations(employees, ({one, many}) => ({
	employee: one(employees, {
		fields: [employees.supervisor],
		references: [employees.id],
		relationName: "employees_supervisor_employees_id"
	}),
	employees: many(employees, {
		relationName: "employees_supervisor_employees_id"
	}),
	projects_projectManager: many(projects),
	rfis_ballInCourtEmployeeId: many(rfis, {
		relationName: "rfis_ballInCourtEmployeeId_employees_id"
	}),
	rfis_createdByEmployeeId: many(rfis, {
		relationName: "rfis_createdByEmployeeId_employees_id"
	}),
	rfis_rfiManagerEmployeeId: many(rfis, {
		relationName: "rfis_rfiManagerEmployeeId_employees_id"
	}),
	rfiAssignees: many(rfiAssignees),
}));

export const fmOptimizationSuggestionsRelations = relations(fmOptimizationSuggestions, ({one}) => ({
	fmFormSubmission: one(fmFormSubmissions, {
		fields: [fmOptimizationSuggestions.formSubmissionId],
		references: [fmFormSubmissions.id]
	}),
}));

export const fmFormSubmissionsRelations = relations(fmFormSubmissions, ({many}) => ({
	fmOptimizationSuggestions: many(fmOptimizationSuggestions),
}));

export const designRecommendationsRelations = relations(designRecommendations, ({one}) => ({
	userProject: one(userProjects, {
		fields: [designRecommendations.projectId],
		references: [userProjects.id]
	}),
}));

export const userProjectsRelations = relations(userProjects, ({many}) => ({
	designRecommendations: many(designRecommendations),
}));

export const chatSessionsRelations = relations(chatSessions, ({one, many}) => ({
	users: one(users, {
		fields: [chatSessions.userId],
		references: [users.id]
	}),
	chatMessages: many(chatMessages),
}));

export const issuesRelations = relations(issues, ({one}) => ({
	project: one(projects, {
		fields: [issues.projectId],
		references: [projects.id]
	}),
}));

export const subcontractorProjectsRelations = relations(subcontractorProjects, ({one}) => ({
	subcontractor: one(subcontractors, {
		fields: [subcontractorProjects.subcontractorId],
		references: [subcontractors.id]
	}),
}));

export const subcontractorsRelations = relations(subcontractors, ({many}) => ({
	subcontractorProjects: many(subcontractorProjects),
	subcontractorContacts: many(subcontractorContacts),
	subcontractorDocuments: many(subcontractorDocuments),
	financialContracts: many(financialContracts),
}));

export const fmGlobalFiguresRelations = relations(fmGlobalFigures, ({many}) => ({
	fmGlobalTables: many(fmGlobalTables),
}));

export const notesRelations = relations(notes, ({one}) => ({
	project: one(projects, {
		fields: [notes.projectId],
		references: [projects.id]
	}),
}));

export const fmSectionsRelations = relations(fmSections, ({one, many}) => ({
	fmSection: one(fmSections, {
		fields: [fmSections.parentId],
		references: [fmSections.id],
		relationName: "fmSections_parentId_fmSections_id"
	}),
	fmSections: many(fmSections, {
		relationName: "fmSections_parentId_fmSections_id"
	}),
	fmBlocks: many(fmBlocks),
}));

export const asrsSectionsRelations = relations(asrsSections, ({one, many}) => ({
	asrsSection: one(asrsSections, {
		fields: [asrsSections.parentId],
		references: [asrsSections.id],
		relationName: "asrsSections_parentId_asrsSections_id"
	}),
	asrsSections: many(asrsSections, {
		relationName: "asrsSections_parentId_asrsSections_id"
	}),
	asrsProtectionRules: many(asrsProtectionRules),
	asrsLogicCards: many(asrsLogicCards),
	asrsBlocks: many(asrsBlocks),
}));

export const fmBlocksRelations = relations(fmBlocks, ({one}) => ({
	fmSection: one(fmSections, {
		fields: [fmBlocks.sectionId],
		references: [fmSections.id]
	}),
}));

export const asrsProtectionRulesRelations = relations(asrsProtectionRules, ({one}) => ({
	asrsSection: one(asrsSections, {
		fields: [asrsProtectionRules.sectionId],
		references: [asrsSections.id]
	}),
}));

export const blockEmbeddingsRelations = relations(blockEmbeddings, ({one}) => ({
	asrsBlock: one(asrsBlocks, {
		fields: [blockEmbeddings.blockId],
		references: [asrsBlocks.id]
	}),
}));

export const asrsBlocksRelations = relations(asrsBlocks, ({one, many}) => ({
	blockEmbeddings: many(blockEmbeddings),
	asrsSection: one(asrsSections, {
		fields: [asrsBlocks.sectionId],
		references: [asrsSections.id]
	}),
}));

export const projectMembersRelations = relations(projectMembers, ({one}) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id]
	}),
}));

export const projectUsersRelations = relations(projectUsers, ({one}) => ({
	project: one(projects, {
		fields: [projectUsers.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [projectUsers.userId],
		references: [users.id]
	}),
}));

export const specificationsRelations = relations(specifications, ({one, many}) => ({
	project: one(projects, {
		fields: [specifications.projectId],
		references: [projects.id]
	}),
	submittals: many(submittals),
	discrepancies: many(discrepancies),
}));

export const contactsRelations = relations(contacts, ({one, many}) => ({
	company: one(companies, {
		fields: [contacts.companyId],
		references: [companies.id]
	}),
	prospects: many(prospects),
}));

export const companiesRelations = relations(companies, ({many}) => ({
	contacts: many(contacts),
	vendors: many(vendors),
	contractViews: many(contractViews),
	clients: many(clients),
	dailyLogManpowers: many(dailyLogManpower),
	forecastingCurves: many(forecastingCurves),
	financialContracts: many(financialContracts),
	subcontracts: many(subcontracts),
	projectDirectories: many(projectDirectory),
}));

export const chatHistoryRelations = relations(chatHistory, ({one}) => ({
	users: one(users, {
		fields: [chatHistory.userId],
		references: [users.id]
	}),
}));

export const budgetLineHistoryRelations = relations(budgetLineHistory, ({one}) => ({
	budgetLine: one(budgetLines, {
		fields: [budgetLineHistory.budgetLineId],
		references: [budgetLines.id]
	}),
	users: one(users, {
		fields: [budgetLineHistory.changedBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [budgetLineHistory.projectId],
		references: [projects.id]
	}),
}));

export const budgetLinesRelations = relations(budgetLines, ({one, many}) => ({
	budgetLineHistories: many(budgetLineHistory),
	budgetModificationLines: many(budgetModificationLines),
	commitmentLines: many(commitmentLines),
	commitmentChangeOrderLines: many(commitmentChangeOrderLines),
	costCode: one(costCodes, {
		fields: [budgetLines.costCodeId],
		references: [costCodes.id]
	}),
	costCodeType: one(costCodeTypes, {
		fields: [budgetLines.costTypeId],
		references: [costCodeTypes.id]
	}),
	users_createdBy: one(users, {
		fields: [budgetLines.createdBy],
		references: [users.id],
		relationName: "budgetLines_createdBy_users_id"
	}),
	forecastingCurve: one(forecastingCurves, {
		fields: [budgetLines.defaultCurveId],
		references: [forecastingCurves.id]
	}),
	projectBudgetCode: one(projectBudgetCodes, {
		fields: [budgetLines.projectBudgetCodeId],
		references: [projectBudgetCodes.id]
	}),
	project: one(projects, {
		fields: [budgetLines.projectId],
		references: [projects.id]
	}),
	subJob: one(subJobs, {
		fields: [budgetLines.subJobId],
		references: [subJobs.id]
	}),
	users_updatedBy: one(users, {
		fields: [budgetLines.updatedBy],
		references: [users.id],
		relationName: "budgetLines_updatedBy_users_id"
	}),
}));

export const contractPaymentsRelations = relations(contractPayments, ({one}) => ({
	users: one(users, {
		fields: [contractPayments.approvedBy],
		references: [users.id]
	}),
	contractBillingPeriod: one(contractBillingPeriods, {
		fields: [contractPayments.billingPeriodId],
		references: [contractBillingPeriods.id]
	}),
	primeContract: one(primeContracts, {
		fields: [contractPayments.contractId],
		references: [primeContracts.id]
	}),
}));

export const contractBillingPeriodsRelations = relations(contractBillingPeriods, ({one, many}) => ({
	contractPayments: many(contractPayments),
	primeContract: one(primeContracts, {
		fields: [contractBillingPeriods.contractId],
		references: [primeContracts.id]
	}),
}));

export const primeContractsRelations = relations(primeContracts, ({one, many}) => ({
	contractPayments: many(contractPayments),
	contractBillingPeriods: many(contractBillingPeriods),
	contractSnapshots: many(contractSnapshots),
	contractDocuments: many(contractDocuments),
	users: one(users, {
		fields: [primeContracts.createdBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [primeContracts.projectId],
		references: [projects.id]
	}),
	vendor: one(vendors, {
		fields: [primeContracts.vendorId],
		references: [vendors.id]
	}),
	contractLineItems: many(contractLineItems),
	contractChangeOrders: many(contractChangeOrders),
}));

export const risksRelations = relations(risks, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [risks.metadataId],
		references: [documentMetadata.id]
	}),
	meetingSegment: one(meetingSegments, {
		fields: [risks.segmentId],
		references: [meetingSegments.id]
	}),
	document: one(documents, {
		fields: [risks.sourceChunkId],
		references: [documents.id]
	}),
}));

export const submittalsRelations = relations(submittals, ({one, many}) => ({
	project: one(projects, {
		fields: [submittals.projectId],
		references: [projects.id]
	}),
	specification: one(specifications, {
		fields: [submittals.specificationId],
		references: [specifications.id]
	}),
	submittalType: one(submittalTypes, {
		fields: [submittals.submittalTypeId],
		references: [submittalTypes.id]
	}),
	user: one(users, {
		fields: [submittals.submittedBy],
		references: [users.id]
	}),
	submittalDocuments: many(submittalDocuments),
	discrepancies: many(discrepancies),
	reviews: many(reviews),
	aiAnalysisJobs: many(aiAnalysisJobs),
	submittalHistories: many(submittalHistory),
	submittalNotifications: many(submittalNotifications),
	submittalAnalyticsEvents: many(submittalAnalyticsEvents),
}));

export const submittalTypesRelations = relations(submittalTypes, ({many}) => ({
	submittals: many(submittals),
}));

export const projectResourcesRelations = relations(projectResources, ({one}) => ({
	project: one(projects, {
		fields: [projectResources.projectId],
		references: [projects.id]
	}),
}));

export const submittalDocumentsRelations = relations(submittalDocuments, ({one, many}) => ({
	submittal: one(submittals, {
		fields: [submittalDocuments.submittalId],
		references: [submittals.id]
	}),
	user: one(users, {
		fields: [submittalDocuments.uploadedBy],
		references: [users.id]
	}),
	discrepancies: many(discrepancies),
	reviewComments: many(reviewComments),
}));

export const filesRelations = relations(files, ({one}) => ({
	project: one(projects, {
		fields: [files.projectId],
		references: [projects.id]
	}),
}));

export const requestsRelations = relations(requests, ({one}) => ({
	userProfile: one(userProfiles, {
		fields: [requests.userId],
		references: [userProfiles.id]
	}),
}));

export const userProfilesRelations = relations(userProfiles, ({one, many}) => ({
	requests: many(requests),
	users: one(users, {
		fields: [userProfiles.id],
		references: [users.id]
	}),
	conversations: many(conversations),
}));

export const asrsLogicCardsRelations = relations(asrsLogicCards, ({one}) => ({
	asrsSection: one(asrsSections, {
		fields: [asrsLogicCards.sectionId],
		references: [asrsSections.id]
	}),
}));

export const discrepanciesRelations = relations(discrepancies, ({one, many}) => ({
	submittalDocument: one(submittalDocuments, {
		fields: [discrepancies.documentId],
		references: [submittalDocuments.id]
	}),
	specification: one(specifications, {
		fields: [discrepancies.specificationId],
		references: [specifications.id]
	}),
	submittal: one(submittals, {
		fields: [discrepancies.submittalId],
		references: [submittals.id]
	}),
	reviewComments: many(reviewComments),
}));

export const tasksRelations = relations(tasks, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [tasks.metadataId],
		references: [documentMetadata.id]
	}),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	meetingSegment: one(meetingSegments, {
		fields: [tasks.segmentId],
		references: [meetingSegments.id]
	}),
	document: one(documents, {
		fields: [tasks.sourceChunkId],
		references: [documents.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one, many}) => ({
	user: one(users, {
		fields: [reviews.reviewerId],
		references: [users.id]
	}),
	submittal: one(submittals, {
		fields: [reviews.submittalId],
		references: [submittals.id]
	}),
	reviewComments: many(reviewComments),
}));

export const reviewCommentsRelations = relations(reviewComments, ({one}) => ({
	user: one(users, {
		fields: [reviewComments.createdBy],
		references: [users.id]
	}),
	discrepancy: one(discrepancies, {
		fields: [reviewComments.discrepancyId],
		references: [discrepancies.id]
	}),
	submittalDocument: one(submittalDocuments, {
		fields: [reviewComments.documentId],
		references: [submittalDocuments.id]
	}),
	review: one(reviews, {
		fields: [reviewComments.reviewId],
		references: [reviews.id]
	}),
}));

export const profilesRelations = relations(profiles, ({one}) => ({
	users: one(users, {
		fields: [profiles.id],
		references: [users.id]
	}),
}));

export const aiAnalysisJobsRelations = relations(aiAnalysisJobs, ({one}) => ({
	submittal: one(submittals, {
		fields: [aiAnalysisJobs.submittalId],
		references: [submittals.id]
	}),
}));

export const nodsPageSectionRelations = relations(nodsPageSection, ({one}) => ({
	nodsPage: one(nodsPage, {
		fields: [nodsPageSection.pageId],
		references: [nodsPage.id]
	}),
}));

export const submittalHistoryRelations = relations(submittalHistory, ({one}) => ({
	user: one(users, {
		fields: [submittalHistory.actorId],
		references: [users.id]
	}),
	submittal: one(submittals, {
		fields: [submittalHistory.submittalId],
		references: [submittals.id]
	}),
}));

export const submittalNotificationsRelations = relations(submittalNotifications, ({one}) => ({
	project: one(projects, {
		fields: [submittalNotifications.projectId],
		references: [projects.id]
	}),
	submittal: one(submittals, {
		fields: [submittalNotifications.submittalId],
		references: [submittals.id]
	}),
	user: one(users, {
		fields: [submittalNotifications.userId],
		references: [users.id]
	}),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatSession: one(chatSessions, {
		fields: [chatMessages.sessionId],
		references: [chatSessions.id]
	}),
}));

export const vendorsRelations = relations(vendors, ({one, many}) => ({
	company: one(companies, {
		fields: [vendors.companyId],
		references: [companies.id]
	}),
	primeContracts: many(primeContracts),
}));

export const contractViewsRelations = relations(contractViews, ({one}) => ({
	company: one(companies, {
		fields: [contractViews.companyId],
		references: [companies.id]
	}),
	users: one(users, {
		fields: [contractViews.userId],
		references: [users.id]
	}),
}));

export const contractSnapshotsRelations = relations(contractSnapshots, ({one}) => ({
	primeContract: one(primeContracts, {
		fields: [contractSnapshots.contractId],
		references: [primeContracts.id]
	}),
	users: one(users, {
		fields: [contractSnapshots.createdBy],
		references: [users.id]
	}),
}));

export const contractDocumentsRelations = relations(contractDocuments, ({one}) => ({
	primeContract: one(primeContracts, {
		fields: [contractDocuments.contractId],
		references: [primeContracts.id]
	}),
	users: one(users, {
		fields: [contractDocuments.uploadedBy],
		references: [users.id]
	}),
}));

export const submittalAnalyticsEventsRelations = relations(submittalAnalyticsEvents, ({one}) => ({
	project: one(projects, {
		fields: [submittalAnalyticsEvents.projectId],
		references: [projects.id]
	}),
	submittal: one(submittals, {
		fields: [submittalAnalyticsEvents.submittalId],
		references: [submittals.id]
	}),
	user: one(users, {
		fields: [submittalAnalyticsEvents.userId],
		references: [users.id]
	}),
}));

export const submittalPerformanceMetricsRelations = relations(submittalPerformanceMetrics, ({one}) => ({
	project: one(projects, {
		fields: [submittalPerformanceMetrics.projectId],
		references: [projects.id]
	}),
}));

export const projectBriefingsRelations = relations(projectBriefings, ({one, many}) => ({
	project: one(projects, {
		fields: [projectBriefings.projectId],
		references: [projects.id]
	}),
	briefingRuns: many(briefingRuns),
}));

export const budgetModificationLinesRelations = relations(budgetModificationLines, ({one}) => ({
	budgetLine: one(budgetLines, {
		fields: [budgetModificationLines.budgetLineId],
		references: [budgetLines.id]
	}),
	budgetModification: one(budgetModifications, {
		fields: [budgetModificationLines.budgetModificationId],
		references: [budgetModifications.id]
	}),
}));

export const budgetModificationsRelations = relations(budgetModifications, ({one, many}) => ({
	budgetModificationLines: many(budgetModificationLines),
	budgetModLines: many(budgetModLines),
	users: one(users, {
		fields: [budgetModifications.createdBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [budgetModifications.projectId],
		references: [projects.id]
	}),
}));

export const commitmentLinesRelations = relations(commitmentLines, ({one}) => ({
	budgetLine: one(budgetLines, {
		fields: [commitmentLines.budgetLineId],
		references: [budgetLines.id]
	}),
	commitment: one(commitments, {
		fields: [commitmentLines.commitmentId],
		references: [commitments.id]
	}),
	costCode: one(costCodes, {
		fields: [commitmentLines.costCodeId],
		references: [costCodes.id]
	}),
	costCodeType: one(costCodeTypes, {
		fields: [commitmentLines.costTypeId],
		references: [costCodeTypes.id]
	}),
}));

export const commitmentsRelations = relations(commitments, ({one, many}) => ({
	commitmentLines: many(commitmentLines),
	commitmentChangeOrders: many(commitmentChangeOrders),
	commitmentChanges: many(commitmentChanges),
	scheduleOfValues: many(scheduleOfValues),
	project: one(projects, {
		fields: [commitments.projectId],
		references: [projects.id]
	}),
}));

export const briefingRunsRelations = relations(briefingRuns, ({one}) => ({
	projectBriefing: one(projectBriefings, {
		fields: [briefingRuns.briefingId],
		references: [projectBriefings.id]
	}),
}));

export const clientsRelations = relations(clients, ({one, many}) => ({
	company: one(companies, {
		fields: [clients.companyId],
		references: [companies.id]
	}),
	projects_clientId: many(projects),
	prospects: many(prospects),
	contracts_architectEngineerId: many(contracts, {
		relationName: "contracts_architectEngineerId_clients_id"
	}),
	contracts_clientId: many(contracts, {
		relationName: "contracts_clientId_clients_id"
	}),
	contracts_contractorId: many(contracts, {
		relationName: "contracts_contractorId_clients_id"
	}),
	contracts_ownerClientId: many(contracts, {
		relationName: "contracts_ownerClientId_clients_id"
	}),
}));

export const subcontractorContactsRelations = relations(subcontractorContacts, ({one}) => ({
	subcontractor: one(subcontractors, {
		fields: [subcontractorContacts.subcontractorId],
		references: [subcontractors.id]
	}),
}));

export const subcontractorDocumentsRelations = relations(subcontractorDocuments, ({one}) => ({
	subcontractor: one(subcontractors, {
		fields: [subcontractorDocuments.subcontractorId],
		references: [subcontractors.id]
	}),
}));

export const prospectsRelations = relations(prospects, ({one}) => ({
	client: one(clients, {
		fields: [prospects.clientId],
		references: [clients.id]
	}),
	project: one(projects, {
		fields: [prospects.projectId],
		references: [projects.id]
	}),
}));

export const appUsersRelations = relations(appUsers, ({many}) => ({
	projects_budgetLockedBy: many(projects),
	scheduleOfValues: many(scheduleOfValues),
}));

export const fmSprinklerConfigsRelations = relations(fmSprinklerConfigs, ({one}) => ({
	fmGlobalTable: one(fmGlobalTables, {
		fields: [fmSprinklerConfigs.tableId],
		references: [fmGlobalTables.tableId]
	}),
}));

export const commitmentChangeOrderLinesRelations = relations(commitmentChangeOrderLines, ({one}) => ({
	budgetLine: one(budgetLines, {
		fields: [commitmentChangeOrderLines.budgetLineId],
		references: [budgetLines.id]
	}),
	commitmentChangeOrder: one(commitmentChangeOrders, {
		fields: [commitmentChangeOrderLines.commitmentChangeOrderId],
		references: [commitmentChangeOrders.id]
	}),
	costCode: one(costCodes, {
		fields: [commitmentChangeOrderLines.costCodeId],
		references: [costCodes.id]
	}),
	costCodeType: one(costCodeTypes, {
		fields: [commitmentChangeOrderLines.costTypeId],
		references: [costCodeTypes.id]
	}),
}));

export const commitmentChangeOrdersRelations = relations(commitmentChangeOrders, ({one, many}) => ({
	commitmentChangeOrderLines: many(commitmentChangeOrderLines),
	users_approvedBy: one(users, {
		fields: [commitmentChangeOrders.approvedBy],
		references: [users.id],
		relationName: "commitmentChangeOrders_approvedBy_users_id"
	}),
	commitment: one(commitments, {
		fields: [commitmentChangeOrders.commitmentId],
		references: [commitments.id]
	}),
	users_requestedBy: one(users, {
		fields: [commitmentChangeOrders.requestedBy],
		references: [users.id],
		relationName: "commitmentChangeOrders_requestedBy_users_id"
	}),
}));

export const qtoItemsRelations = relations(qtoItems, ({one}) => ({
	project: one(projects, {
		fields: [qtoItems.projectId],
		references: [projects.id]
	}),
	qto: one(qtos, {
		fields: [qtoItems.qtoId],
		references: [qtos.id]
	}),
}));

export const qtosRelations = relations(qtos, ({one, many}) => ({
	qtoItems: many(qtoItems),
	project: one(projects, {
		fields: [qtos.projectId],
		references: [projects.id]
	}),
}));

export const changeOrdersRelations = relations(changeOrders, ({one, many}) => ({
	project: one(projects, {
		fields: [changeOrders.projectId],
		references: [projects.id]
	}),
	changeOrderCosts: many(changeOrderCosts),
	changeOrderApprovals: many(changeOrderApprovals),
	changeOrderLines: many(changeOrderLines),
}));

export const changeOrderCostsRelations = relations(changeOrderCosts, ({one}) => ({
	changeOrder: one(changeOrders, {
		fields: [changeOrderCosts.changeOrderId],
		references: [changeOrders.id]
	}),
}));

export const changeOrderApprovalsRelations = relations(changeOrderApprovals, ({one}) => ({
	changeOrder: one(changeOrders, {
		fields: [changeOrderApprovals.changeOrderId],
		references: [changeOrders.id]
	}),
}));

export const attachmentsRelations = relations(attachments, ({one}) => ({
	project: one(projects, {
		fields: [attachments.projectId],
		references: [projects.id]
	}),
}));

export const scheduleTasksRelations = relations(scheduleTasks, ({one, many}) => ({
	project: one(projects, {
		fields: [scheduleTasks.projectId],
		references: [projects.id]
	}),
	scheduleTaskDependencies_predecessorTaskId: many(scheduleTaskDependencies, {
		relationName: "scheduleTaskDependencies_predecessorTaskId_scheduleTasks_id"
	}),
	scheduleTaskDependencies_taskId: many(scheduleTaskDependencies, {
		relationName: "scheduleTaskDependencies_taskId_scheduleTasks_id"
	}),
	scheduleResources: many(scheduleResources),
	scheduleProgressUpdates: many(scheduleProgressUpdates),
}));

export const scheduleTaskDependenciesRelations = relations(scheduleTaskDependencies, ({one}) => ({
	scheduleTask_predecessorTaskId: one(scheduleTasks, {
		fields: [scheduleTaskDependencies.predecessorTaskId],
		references: [scheduleTasks.id],
		relationName: "scheduleTaskDependencies_predecessorTaskId_scheduleTasks_id"
	}),
	scheduleTask_taskId: one(scheduleTasks, {
		fields: [scheduleTaskDependencies.taskId],
		references: [scheduleTasks.id],
		relationName: "scheduleTaskDependencies_taskId_scheduleTasks_id"
	}),
}));

export const scheduleResourcesRelations = relations(scheduleResources, ({one}) => ({
	scheduleTask: one(scheduleTasks, {
		fields: [scheduleResources.taskId],
		references: [scheduleTasks.id]
	}),
}));

export const scheduleProgressUpdatesRelations = relations(scheduleProgressUpdates, ({one}) => ({
	scheduleTask: one(scheduleTasks, {
		fields: [scheduleProgressUpdates.taskId],
		references: [scheduleTasks.id]
	}),
}));

export const decisionsRelations = relations(decisions, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [decisions.metadataId],
		references: [documentMetadata.id]
	}),
	meetingSegment: one(meetingSegments, {
		fields: [decisions.segmentId],
		references: [meetingSegments.id]
	}),
	document: one(documents, {
		fields: [decisions.sourceChunkId],
		references: [documents.id]
	}),
}));

export const opportunitiesRelations = relations(opportunities, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [opportunities.metadataId],
		references: [documentMetadata.id]
	}),
	meetingSegment: one(meetingSegments, {
		fields: [opportunities.segmentId],
		references: [meetingSegments.id]
	}),
	document: one(documents, {
		fields: [opportunities.sourceChunkId],
		references: [documents.id]
	}),
}));

export const procoreScreenshotsRelations = relations(procoreScreenshots, ({one, many}) => ({
	procoreCaptureSession: one(procoreCaptureSessions, {
		fields: [procoreScreenshots.sessionId],
		references: [procoreCaptureSessions.id]
	}),
	procoreComponents: many(procoreComponents),
}));

export const procoreCaptureSessionsRelations = relations(procoreCaptureSessions, ({many}) => ({
	procoreScreenshots: many(procoreScreenshots),
}));

export const firefliesIngestionJobsRelations = relations(firefliesIngestionJobs, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [firefliesIngestionJobs.metadataId],
		references: [documentMetadata.id]
	}),
}));

export const projectRelations = relations(project, ({one}) => ({
	appUser: one(appUsers, {
		fields: [project.budgetLockedBy],
		references: [appUsers.id]
	}),
	client: one(clients, {
		fields: [project.clientId],
		references: [clients.id]
	}),
	employee: one(employees, {
		fields: [project.projectManager],
		references: [employees.id]
	}),
}));

export const groupsRelations = relations(groups, ({one, many}) => ({
	users: one(users, {
		fields: [groups.createdBy],
		references: [users.id]
	}),
	groupMembers: many(groupMembers),
	documentGroupAccesses: many(documentGroupAccess),
}));

export const procoreComponentsRelations = relations(procoreComponents, ({one}) => ({
	procoreScreenshot: one(procoreScreenshots, {
		fields: [procoreComponents.screenshotId],
		references: [procoreScreenshots.id]
	}),
}));

export const crawledPagesRelations = relations(crawledPages, ({one}) => ({
	source: one(sources, {
		fields: [crawledPages.sourceId],
		references: [sources.sourceId]
	}),
}));

export const sourcesRelations = relations(sources, ({many}) => ({
	crawledPages: many(crawledPages),
	codeExamples: many(codeExamples),
}));

export const procoreFeaturesRelations = relations(procoreFeatures, ({one}) => ({
	procoreModule: one(procoreModules, {
		fields: [procoreFeatures.moduleId],
		references: [procoreModules.id]
	}),
}));

export const procoreModulesRelations = relations(procoreModules, ({many}) => ({
	procoreFeatures: many(procoreFeatures),
}));

export const directCostsRelations = relations(directCosts, ({one}) => ({
	project: one(projects, {
		fields: [directCosts.projectId],
		references: [projects.id]
	}),
}));

export const commitmentChangesRelations = relations(commitmentChanges, ({one}) => ({
	commitment: one(commitments, {
		fields: [commitmentChanges.commitmentId],
		references: [commitments.id]
	}),
}));

export const codeExamplesRelations = relations(codeExamples, ({one}) => ({
	source: one(sources, {
		fields: [codeExamples.sourceId],
		references: [sources.sourceId]
	}),
}));

export const erpSyncLogRelations = relations(erpSyncLog, ({one}) => ({
	project: one(projects, {
		fields: [erpSyncLog.projectId],
		references: [projects.id]
	}),
}));

export const primeContractSovsRelations = relations(primeContractSovs, ({one}) => ({
	contract: one(contracts, {
		fields: [primeContractSovs.contractId],
		references: [contracts.id]
	}),
}));

export const contractsRelations = relations(contracts, ({one, many}) => ({
	primeContractSovs: many(primeContractSovs),
	primePotentialChangeOrders: many(primePotentialChangeOrders),
	primeContractChangeOrders: many(primeContractChangeOrders),
	ownerInvoices: many(ownerInvoices),
	paymentTransactions: many(paymentTransactions),
	scheduleOfValues: many(scheduleOfValues),
	client_architectEngineerId: one(clients, {
		fields: [contracts.architectEngineerId],
		references: [clients.id],
		relationName: "contracts_architectEngineerId_clients_id"
	}),
	client_clientId: one(clients, {
		fields: [contracts.clientId],
		references: [clients.id],
		relationName: "contracts_clientId_clients_id"
	}),
	client_contractorId: one(clients, {
		fields: [contracts.contractorId],
		references: [clients.id],
		relationName: "contracts_contractorId_clients_id"
	}),
	client_ownerClientId: one(clients, {
		fields: [contracts.ownerClientId],
		references: [clients.id],
		relationName: "contracts_ownerClientId_clients_id"
	}),
	project: one(projects, {
		fields: [contracts.projectId],
		references: [projects.id]
	}),
}));

export const primePotentialChangeOrdersRelations = relations(primePotentialChangeOrders, ({one, many}) => ({
	changeEvent: one(changeEvents, {
		fields: [primePotentialChangeOrders.changeEventId],
		references: [changeEvents.id]
	}),
	contract: one(contracts, {
		fields: [primePotentialChangeOrders.contractId],
		references: [contracts.id]
	}),
	project: one(projects, {
		fields: [primePotentialChangeOrders.projectId],
		references: [projects.id]
	}),
	pcoLineItems: many(pcoLineItems),
	pccoLineItems: many(pccoLineItems),
}));

export const changeEventsRelations = relations(changeEvents, ({one, many}) => ({
	primePotentialChangeOrders: many(primePotentialChangeOrders),
	changeEventLineItems: many(changeEventLineItems),
	project: one(projects, {
		fields: [changeEvents.projectId],
		references: [projects.id]
	}),
}));

export const changeEventLineItemsRelations = relations(changeEventLineItems, ({one, many}) => ({
	changeEvent: one(changeEvents, {
		fields: [changeEventLineItems.changeEventId],
		references: [changeEvents.id]
	}),
	pcoLineItems: many(pcoLineItems),
}));

export const pcoLineItemsRelations = relations(pcoLineItems, ({one}) => ({
	changeEventLineItem: one(changeEventLineItems, {
		fields: [pcoLineItems.changeEventLineItemId],
		references: [changeEventLineItems.id]
	}),
	primePotentialChangeOrder: one(primePotentialChangeOrders, {
		fields: [pcoLineItems.pcoId],
		references: [primePotentialChangeOrders.id]
	}),
}));

export const primeContractChangeOrdersRelations = relations(primeContractChangeOrders, ({one, many}) => ({
	contract: one(contracts, {
		fields: [primeContractChangeOrders.contractId],
		references: [contracts.id]
	}),
	pccoLineItems: many(pccoLineItems),
}));

export const pccoLineItemsRelations = relations(pccoLineItems, ({one}) => ({
	primeContractChangeOrder: one(primeContractChangeOrders, {
		fields: [pccoLineItems.pccoId],
		references: [primeContractChangeOrders.id]
	}),
	primePotentialChangeOrder: one(primePotentialChangeOrders, {
		fields: [pccoLineItems.pcoId],
		references: [primePotentialChangeOrders.id]
	}),
}));

export const ownerInvoiceLineItemsRelations = relations(ownerInvoiceLineItems, ({one}) => ({
	ownerInvoice: one(ownerInvoices, {
		fields: [ownerInvoiceLineItems.invoiceId],
		references: [ownerInvoices.id]
	}),
}));

export const ownerInvoicesRelations = relations(ownerInvoices, ({one, many}) => ({
	ownerInvoiceLineItems: many(ownerInvoiceLineItems),
	billingPeriod: one(billingPeriods, {
		fields: [ownerInvoices.billingPeriodId],
		references: [billingPeriods.id]
	}),
	contract: one(contracts, {
		fields: [ownerInvoices.contractId],
		references: [contracts.id]
	}),
	paymentTransactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({one}) => ({
	contract: one(contracts, {
		fields: [paymentTransactions.contractId],
		references: [contracts.id]
	}),
	ownerInvoice: one(ownerInvoices, {
		fields: [paymentTransactions.invoiceId],
		references: [ownerInvoices.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	userProfile: one(userProfiles, {
		fields: [conversations.userId],
		references: [userProfiles.id]
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.sessionId],
		references: [conversations.sessionId]
	}),
}));

export const documentRowsRelations = relations(documentRows, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [documentRows.datasetId],
		references: [documentMetadata.id]
	}),
}));

export const projectInsightsRelations = relations(projectInsights, ({one}) => ({
	project: one(projects, {
		fields: [projectInsights.projectId],
		references: [projects.id]
	}),
}));

export const chatThreadItemsRelations = relations(chatThreadItems, ({one}) => ({
	chatThread: one(chatThreads, {
		fields: [chatThreadItems.threadId],
		references: [chatThreads.id]
	}),
}));

export const chatThreadsRelations = relations(chatThreads, ({many}) => ({
	chatThreadItems: many(chatThreadItems),
	chatThreadAttachments: many(chatThreadAttachments),
	chatThreadFeedbacks: many(chatThreadFeedback),
}));

export const chatThreadAttachmentsRelations = relations(chatThreadAttachments, ({one, many}) => ({
	chatThread: one(chatThreads, {
		fields: [chatThreadAttachments.threadId],
		references: [chatThreads.id]
	}),
	chatThreadAttachmentFiles: many(chatThreadAttachmentFiles),
}));

export const chatThreadFeedbackRelations = relations(chatThreadFeedback, ({one}) => ({
	chatThread: one(chatThreads, {
		fields: [chatThreadFeedback.threadId],
		references: [chatThreads.id]
	}),
}));

export const chatThreadAttachmentFilesRelations = relations(chatThreadAttachmentFiles, ({one}) => ({
	chatThreadAttachment: one(chatThreadAttachments, {
		fields: [chatThreadAttachmentFiles.attachmentId],
		references: [chatThreadAttachments.id]
	}),
}));

export const rfisRelations = relations(rfis, ({one, many}) => ({
	employee_ballInCourtEmployeeId: one(employees, {
		fields: [rfis.ballInCourtEmployeeId],
		references: [employees.id],
		relationName: "rfis_ballInCourtEmployeeId_employees_id"
	}),
	employee_createdByEmployeeId: one(employees, {
		fields: [rfis.createdByEmployeeId],
		references: [employees.id],
		relationName: "rfis_createdByEmployeeId_employees_id"
	}),
	project: one(projects, {
		fields: [rfis.projectId],
		references: [projects.id]
	}),
	employee_rfiManagerEmployeeId: one(employees, {
		fields: [rfis.rfiManagerEmployeeId],
		references: [employees.id],
		relationName: "rfis_rfiManagerEmployeeId_employees_id"
	}),
	rfiAssignees: many(rfiAssignees),
}));

export const documentInsightsRelations = relations(documentInsights, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [documentInsights.documentId],
		references: [documentMetadata.id]
	}),
}));

export const aiTasksRelations = relations(aiTasks, ({one}) => ({
	project: one(projects, {
		fields: [aiTasks.projectId],
		references: [projects.id]
	}),
	documentMetadatum: one(documentMetadata, {
		fields: [aiTasks.sourceDocumentId],
		references: [documentMetadata.id]
	}),
}));

export const ingestionJobsRelations = relations(ingestionJobs, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [ingestionJobs.documentId],
		references: [documentMetadata.id]
	}),
}));

export const aiInsightsRelations = relations(aiInsights, ({one}) => ({
	chunk: one(chunks, {
		fields: [aiInsights.chunksId],
		references: [chunks.id]
	}),
}));

export const dailyLogEquipmentRelations = relations(dailyLogEquipment, ({one}) => ({
	dailyLog: one(dailyLogs, {
		fields: [dailyLogEquipment.dailyLogId],
		references: [dailyLogs.id]
	}),
}));

export const dailyLogsRelations = relations(dailyLogs, ({one, many}) => ({
	dailyLogEquipments: many(dailyLogEquipment),
	user: one(users, {
		fields: [dailyLogs.createdBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [dailyLogs.projectId],
		references: [projects.id]
	}),
	dailyLogManpowers: many(dailyLogManpower),
	dailyLogNotes: many(dailyLogNotes),
}));

export const dailyLogManpowerRelations = relations(dailyLogManpower, ({one}) => ({
	company: one(companies, {
		fields: [dailyLogManpower.companyId],
		references: [companies.id]
	}),
	dailyLog: one(dailyLogs, {
		fields: [dailyLogManpower.dailyLogId],
		references: [dailyLogs.id]
	}),
}));

export const dailyLogNotesRelations = relations(dailyLogNotes, ({one}) => ({
	dailyLog: one(dailyLogs, {
		fields: [dailyLogNotes.dailyLogId],
		references: [dailyLogs.id]
	}),
}));

export const costForecastsRelations = relations(costForecasts, ({one}) => ({
	user: one(users, {
		fields: [costForecasts.createdBy],
		references: [users.id]
	}),
}));

export const directCostLineItemsRelations = relations(directCostLineItems, ({one}) => ({
	users_approvedBy: one(users, {
		fields: [directCostLineItems.approvedBy],
		references: [users.id],
		relationName: "directCostLineItems_approvedBy_users_id"
	}),
	costCode: one(costCodes, {
		fields: [directCostLineItems.costCodeId],
		references: [costCodes.id]
	}),
	users_createdBy: one(users, {
		fields: [directCostLineItems.createdBy],
		references: [users.id],
		relationName: "directCostLineItems_createdBy_users_id"
	}),
	project: one(projects, {
		fields: [directCostLineItems.projectId],
		references: [projects.id]
	}),
}));

export const forecastingCurvesRelations = relations(forecastingCurves, ({one, many}) => ({
	company: one(companies, {
		fields: [forecastingCurves.companyId],
		references: [companies.id]
	}),
	users_createdBy: one(users, {
		fields: [forecastingCurves.createdBy],
		references: [users.id],
		relationName: "forecastingCurves_createdBy_users_id"
	}),
	users_updatedBy: one(users, {
		fields: [forecastingCurves.updatedBy],
		references: [users.id],
		relationName: "forecastingCurves_updatedBy_users_id"
	}),
	budgetLines: many(budgetLines),
}));

export const financialContractsRelations = relations(financialContracts, ({one}) => ({
	company: one(companies, {
		fields: [financialContracts.companyId],
		references: [companies.id]
	}),
	users: one(users, {
		fields: [financialContracts.createdBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [financialContracts.projectId],
		references: [projects.id]
	}),
	subcontractor: one(subcontractors, {
		fields: [financialContracts.subcontractorId],
		references: [subcontractors.id]
	}),
}));

export const scheduleOfValuesRelations = relations(scheduleOfValues, ({one, many}) => ({
	appUser: one(appUsers, {
		fields: [scheduleOfValues.approvedBy],
		references: [appUsers.id]
	}),
	commitment: one(commitments, {
		fields: [scheduleOfValues.commitmentId],
		references: [commitments.id]
	}),
	contract: one(contracts, {
		fields: [scheduleOfValues.contractId],
		references: [contracts.id]
	}),
	sovLineItems: many(sovLineItems),
}));

export const todosRelations = relations(todos, ({one}) => ({
	users: one(users, {
		fields: [todos.userId],
		references: [users.id]
	}),
}));

export const sovLineItemsRelations = relations(sovLineItems, ({one}) => ({
	scheduleOfValue: one(scheduleOfValues, {
		fields: [sovLineItems.sovId],
		references: [scheduleOfValues.id]
	}),
}));

export const verticalMarkupRelations = relations(verticalMarkup, ({one}) => ({
	project: one(projects, {
		fields: [verticalMarkup.projectId],
		references: [projects.id]
	}),
}));

export const costCodeDivisionsRelations = relations(costCodeDivisions, ({many}) => ({
	costCodes: many(costCodes),
}));

export const projectCostCodesRelations = relations(projectCostCodes, ({one}) => ({
	costCode: one(costCodes, {
		fields: [projectCostCodes.costCodeId],
		references: [costCodes.id]
	}),
	costCodeType: one(costCodeTypes, {
		fields: [projectCostCodes.costTypeId],
		references: [costCodeTypes.id]
	}),
	project: one(projects, {
		fields: [projectCostCodes.projectId],
		references: [projects.id]
	}),
}));

export const subcontractSovItemsRelations = relations(subcontractSovItems, ({one}) => ({
	subcontract: one(subcontracts, {
		fields: [subcontractSovItems.subcontractId],
		references: [subcontracts.id]
	}),
}));

export const subcontractsRelations = relations(subcontracts, ({one, many}) => ({
	subcontractSovItems: many(subcontractSovItems),
	company: one(companies, {
		fields: [subcontracts.contractCompanyId],
		references: [companies.id]
	}),
	users: one(users, {
		fields: [subcontracts.createdBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [subcontracts.projectId],
		references: [projects.id]
	}),
	subcontractAttachments: many(subcontractAttachments),
}));

export const projectDirectoryRelations = relations(projectDirectory, ({one}) => ({
	company: one(companies, {
		fields: [projectDirectory.companyId],
		references: [companies.id]
	}),
	project: one(projects, {
		fields: [projectDirectory.projectId],
		references: [projects.id]
	}),
}));

export const subcontractAttachmentsRelations = relations(subcontractAttachments, ({one}) => ({
	subcontract: one(subcontracts, {
		fields: [subcontractAttachments.subcontractId],
		references: [subcontracts.id]
	}),
	users: one(users, {
		fields: [subcontractAttachments.uploadedBy],
		references: [users.id]
	}),
}));

export const budgetViewsRelations = relations(budgetViews, ({one, many}) => ({
	users: one(users, {
		fields: [budgetViews.createdBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [budgetViews.projectId],
		references: [projects.id]
	}),
	budgetViewColumns: many(budgetViewColumns),
}));

export const budgetViewColumnsRelations = relations(budgetViewColumns, ({one}) => ({
	budgetView: one(budgetViews, {
		fields: [budgetViewColumns.viewId],
		references: [budgetViews.id]
	}),
}));

export const contractLineItemsRelations = relations(contractLineItems, ({one}) => ({
	primeContract: one(primeContracts, {
		fields: [contractLineItems.contractId],
		references: [primeContracts.id]
	}),
}));

export const changeOrderLinesRelations = relations(changeOrderLines, ({one}) => ({
	changeOrder: one(changeOrders, {
		fields: [changeOrderLines.changeOrderId],
		references: [changeOrders.id]
	}),
	costCode: one(costCodes, {
		fields: [changeOrderLines.costCodeId],
		references: [costCodes.id]
	}),
	costCodeType: one(costCodeTypes, {
		fields: [changeOrderLines.costTypeId],
		references: [costCodeTypes.id]
	}),
	project: one(projects, {
		fields: [changeOrderLines.projectId],
		references: [projects.id]
	}),
	subJob: one(subJobs, {
		fields: [changeOrderLines.subJobId],
		references: [subJobs.id]
	}),
}));

export const budgetModLinesRelations = relations(budgetModLines, ({one}) => ({
	budgetModification: one(budgetModifications, {
		fields: [budgetModLines.budgetModificationId],
		references: [budgetModifications.id]
	}),
	costCode: one(costCodes, {
		fields: [budgetModLines.costCodeId],
		references: [costCodes.id]
	}),
	costCodeType: one(costCodeTypes, {
		fields: [budgetModLines.costTypeId],
		references: [costCodeTypes.id]
	}),
	project: one(projects, {
		fields: [budgetModLines.projectId],
		references: [projects.id]
	}),
	subJob: one(subJobs, {
		fields: [budgetModLines.subJobId],
		references: [subJobs.id]
	}),
}));

export const contractChangeOrdersRelations = relations(contractChangeOrders, ({one}) => ({
	users_approvedBy: one(users, {
		fields: [contractChangeOrders.approvedBy],
		references: [users.id],
		relationName: "contractChangeOrders_approvedBy_users_id"
	}),
	primeContract: one(primeContracts, {
		fields: [contractChangeOrders.contractId],
		references: [primeContracts.id]
	}),
	users_requestedBy: one(users, {
		fields: [contractChangeOrders.requestedBy],
		references: [users.id],
		relationName: "contractChangeOrders_requestedBy_users_id"
	}),
}));

export const groupMembersRelations = relations(groupMembers, ({one}) => ({
	group: one(groups, {
		fields: [groupMembers.groupId],
		references: [groups.id]
	}),
	users: one(users, {
		fields: [groupMembers.userId],
		references: [users.id]
	}),
}));

export const documentUserAccessRelations = relations(documentUserAccess, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [documentUserAccess.documentId],
		references: [documentMetadata.id]
	}),
	users: one(users, {
		fields: [documentUserAccess.userId],
		references: [users.id]
	}),
}));

export const documentGroupAccessRelations = relations(documentGroupAccess, ({one}) => ({
	documentMetadatum: one(documentMetadata, {
		fields: [documentGroupAccess.documentId],
		references: [documentMetadata.id]
	}),
	group: one(groups, {
		fields: [documentGroupAccess.groupId],
		references: [groups.id]
	}),
}));

export const rfiAssigneesRelations = relations(rfiAssignees, ({one}) => ({
	employee: one(employees, {
		fields: [rfiAssignees.employeeId],
		references: [employees.id]
	}),
	rfi: one(rfis, {
		fields: [rfiAssignees.rfiId],
		references: [rfis.id]
	}),
}));