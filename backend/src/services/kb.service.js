import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export class KbService {
  static async listArticles(query = {}) {
    let qb = supabaseAdmin.from('kb_articles').select('*').order('created_at', { ascending: false });

    if (query.domain) {
      qb = qb.eq('domain', query.domain);
    }
    if (query.category) {
      qb = qb.eq('category', query.category);
    }
    if (query.q) {
      qb = qb.or(`title.ilike.%${query.q}%,content.ilike.%${query.q}%`);
    }

    const { data, error } = await qb;
    if (error) {
      logger.error({ error }, 'Failed to list KB articles');
      throw new AppError('QUERY_KB_FAILED', error.message, 400);
    }
    return data || [];
  }

  static async getArticleById(id) {
    const { data, error } = await supabaseAdmin
      .from('kb_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppError('KB_NOT_FOUND', 'Knowledge Base article not found.', 404);
    }
    return data;
  }

  static async createArticle(data, adminUser) {
    const { data: created, error } = await supabaseAdmin
      .from('kb_articles')
      .insert({
        ...data,
        created_by: adminUser.id,
      })
      .select('*')
      .single();

    if (error || !created) {
      throw new AppError('CREATE_KB_FAILED', error?.message || 'Could not create article.', 400);
    }
    return created;
  }

  static async updateArticle(id, data, adminUser) {
    const { data: updated, error } = await supabaseAdmin
      .from('kb_articles')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !updated) {
      throw new AppError('UPDATE_KB_FAILED', error?.message || 'Could not update article.', 400);
    }
    return updated;
  }

  static async deleteArticle(id, adminUser) {
    const { error } = await supabaseAdmin.from('kb_articles').delete().eq('id', id);
    if (error) {
      throw new AppError('DELETE_KB_FAILED', error.message, 400);
    }
    return { success: true };
  }

  /**
   * Find top N relevant articles for AI grounding
   */
  static async findRelevantArticles({ domain, category, limit = 3 }) {
    // 1. Try matching domain + category
    let { data: articles } = await supabaseAdmin
      .from('kb_articles')
      .select('id, title, content, domain, category')
      .eq('is_published', true)
      .eq('domain', domain)
      .eq('category', category)
      .limit(limit);

    // 2. If fewer than limit, fallback to domain match
    if (!articles || articles.length < limit) {
      const { data: domainArticles } = await supabaseAdmin
        .from('kb_articles')
        .select('id, title, content, domain, category')
        .eq('is_published', true)
        .eq('domain', domain)
        .limit(limit);

      const existingIds = new Set((articles || []).map((a) => a.id));
      const combined = [...(articles || [])];
      for (const da of domainArticles || []) {
        if (!existingIds.has(da.id) && combined.length < limit) {
          combined.push(da);
        }
      }
      articles = combined;
    }

    // 3. Fallback to any general published articles if none found
    if (!articles || articles.length === 0) {
      const { data: general } = await supabaseAdmin
        .from('kb_articles')
        .select('id, title, content, domain, category')
        .eq('is_published', true)
        .limit(limit);
      articles = general || [];
    }

    return articles;
  }
}
