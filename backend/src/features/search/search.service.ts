import type { SearchResults, ISearchRepository } from './search.repository';

export class SearchService {
  constructor(private readonly repo: ISearchRepository) {}

  search(ownerId: string, q: string): Promise<SearchResults> {
    return this.repo.search(ownerId, q);
  }
}
