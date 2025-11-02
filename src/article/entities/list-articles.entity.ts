import { ArticleEntity } from './article.entity';

export class ListArticlesEntity {
  articles: ArticleEntity[];
  articlesCount: number;
  page: number;
  limit: number;

  constructor(data: {
    articles: any[];
    articlesCount: number;
    page: number;
    limit: number;
  }) {
    this.articles = data.articles.map((article) => {
      const fullArticle = new ArticleEntity(article).article;
      const { body, ...articleWithoutBody } = fullArticle;
      return articleWithoutBody;
    });
    this.articlesCount = data.articlesCount;
    this.page = data.page;
    this.limit = data.limit;
  }
}
