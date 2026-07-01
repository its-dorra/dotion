import {
  pagesRepository,
  PagesRepository,
} from "@notion-clone/db/repositories/pages.repo";

class PagesService {
  constructor(private readonly pagesRepository: PagesRepository) {}
}

export const pagesService = new PagesService(pagesRepository);
