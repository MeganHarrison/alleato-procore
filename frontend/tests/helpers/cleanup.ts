import {
  deleteChangeOrdersByProject,
  deleteProject,
  deleteProjectMembers,
} from "./db";

export async function cleanupProjectArtifacts(projectId: number) {
  await deleteChangeOrdersByProject(projectId);
  await deleteProjectMembers(projectId);
  await deleteProject(projectId);
}
