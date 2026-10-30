import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { DOMAINS, CATEGORIES } from '../lib/constants';

export const KnowledgeBase = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal editor states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('ecommerce');
  const [category, setCategory] = useState('refund_return');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedDomain) params.set('domain', selectedDomain);
      if (selectedCategory) params.set('category', selectedCategory);

      const response = await api.get(`/kb?${params.toString()}`);
      if (response?.data) {
        setArticles(response.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load Knowledge Base articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedDomain, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles();
  };

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle('');
    setDomain('ecommerce');
    setCategory('refund_return');
    setContent('');
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (art) => {
    setEditingArticle(art);
    setTitle(art.title);
    setDomain(art.domain);
    setCategory(art.category);
    setContent(art.content);
    setIsPublished(art.is_published);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        domain,
        category,
        content,
        is_published: isPublished,
      };

      if (editingArticle) {
        await api.patch(`/kb/${editingArticle.id}`, payload);
        toast.success('KB article updated!');
      } else {
        await api.post('/kb', payload);
        toast.success('KB article published!');
      }

      setIsModalOpen(false);
      await fetchArticles();
    } catch (err) {
      toast.error(err.message || 'Failed to save KB article.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grounding article?')) return;
    try {
      await api.delete(`/kb/${id}`);
      toast.success('Article removed from Knowledge Base');
      await fetchArticles();
    } catch (err) {
      toast.error(err.message || 'Failed to delete article');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base & AI Grounding Hub"
        description="Verified policies, guides, and FAQs used as strict factual grounding for all Gemini AI responses."
        action={
          isAdmin && (
            <Button variant="primary" size="sm" icon={PlusCircle} onClick={openCreateModal}>
              New Article
            </Button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-5 border border-white/5 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search knowledge articles by keyword..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Domains</option>
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Articles List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Knowledge Base articles found"
          description="Create your first policy or FAQ article to ground AI replies with factual context."
          actionLabel={isAdmin ? 'Create Article' : undefined}
          onAction={isAdmin ? openCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((art) => (
            <Card
              key={art.id}
              className="p-5 sm:p-6 border border-white/5 flex flex-col justify-between hover:border-brand-500/30 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {art.title}
                  </h3>
                  <Badge variant={art.is_published ? 'success' : 'default'} size="sm">
                    {art.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="capitalize font-medium text-brand-300">
                    {art.domain.replace('_', ' ')}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{art.category.replace('_', ' ')}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {art.content}
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit2}
                    onClick={() => openEditModal(art)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(art.id)}
                    className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Article Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArticle ? 'Edit Knowledge Base Article' : 'New Knowledge Base Article'}
        description="Grounding context for the AI reply drafter and customer chat assistant."
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Article Title"
            placeholder="e.g. Standard 30-Day Return & Replacement Policy"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Business Domain"
              options={DOMAINS}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />

            <Select
              label="Issue Category"
              options={CATEGORIES}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <Textarea
            label="Article Content / Grounding Policy Rules"
            rows={8}
            placeholder="Write clear, authoritative rules and steps. The Gemini AI will adhere strictly to this text when formulating customer responses..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-brand-600 focus:ring-brand-500"
            />
            <span>Publish immediately (active for AI grounding)</span>
          </label>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={saving}>
              {editingArticle ? 'Save Changes' : 'Create Article'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
