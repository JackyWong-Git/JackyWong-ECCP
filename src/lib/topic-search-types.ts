export type TopicSearchProvider = 'auto' | 'openserp' | 'searxng' | 'rss';
export type TopicSearchRange = 'day' | 'week' | 'month';

export interface ExternalTopic {
  id: string;
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  provider: Exclude<TopicSearchProvider, 'auto'>;
  publishedAt?: string;
  score: number;
  tags: string[];
}

export interface TopicSearchResponse {
  results: ExternalTopic[];
  providers: Exclude<TopicSearchProvider, 'auto'>[];
  failures: string[];
}
