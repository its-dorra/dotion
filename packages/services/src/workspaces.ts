import {
  WorkspacesRepository,
  workspacesRepository,
} from "@notion-clone/db/repositories/workspaces.repo";

class WorkspacesService {
  constructor(private readonly workspacesRepository: WorkspacesRepository) {}
}

export const workspacesService = new WorkspacesService(workspacesRepository);
