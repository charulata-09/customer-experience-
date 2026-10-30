import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  User,
  Sliders,
  Shield,
  Save,
  Sparkles,
  Lock,
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
import { TONES } from '../lib/constants';

export const Settings = () => {
  const { user, isAdmin, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Brand Settings state (Admin)
  const [brandName, setBrandName] = useState('Acme');
  const [brandVoice, setBrandVoice] = useState('Warm, clear, respectful, solution-focused.');
  const [forbiddenPhrases, setForbiddenPhrases] = useState('');
  const [signature, setSignature] = useState('The Acme Support Team');
  const [defaultTone, setDefaultTone] = useState('empathetic');
  const [savingBrand, setSavingBrand] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchBrand = async () => {
      setLoadingBrand(true);
      try {
        const response = await api.get('/settings/brand');
        if (response?.data) {
          const b = response.data;
          setBrandName(b.brand_name || 'Acme');
          setBrandVoice(b.brand_voice_guidelines || '');
          setForbiddenPhrases((b.forbidden_phrases || []).join(', '));
          setSignature(b.signature || 'The Acme Support Team');
          setDefaultTone(b.default_tone || 'empathetic');
        }
      } catch (err) {
        console.error('Failed to load brand settings:', err);
      } finally {
        setLoadingBrand(false);
      }
    };

    fetchBrand();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch('/auth/me', {
        full_name: fullName,
        avatar_url: avatarUrl || null,
      });
      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    setSavingBrand(true);
    try {
      const phrasesArray = forbiddenPhrases
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await api.put('/settings/brand', {
        brand_name: brandName,
        brand_voice_guidelines: brandVoice,
        forbidden_phrases: phrasesArray,
        signature,
        default_tone: defaultTone,
      });
      toast.success('Brand voice guidelines updated for Gemini AI!');
    } catch (err) {
      toast.error(err.message || 'Failed to update brand settings.');
    } finally {
      setSavingBrand(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Settings & Workspace Configuration"
        description="Manage your user profile and calibrate global AI brand voice guidelines."
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Profile</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'brand'
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>AI Brand Voice & Rules</span>
          </button>
        )}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card title="User Account" description="Update your personal identification and details">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 text-brand-300 flex items-center justify-center text-xl font-bold">
                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{fullName || 'User'}</h3>
                  <Badge variant={isAdmin ? 'purple' : 'brand'} size="sm">
                    {user?.role?.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Avatar Image URL (Optional)"
              placeholder="https://example.com/avatar.png"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />

            <div className="flex justify-end pt-3">
              <Button type="submit" variant="primary" size="md" loading={savingProfile} icon={Save}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Brand Tab (Admin Only) */}
      {activeTab === 'brand' && isAdmin && (
        <Card
          title="AI Brand Voice & Tone Guidelines"
          description="These settings are injected dynamically into Gemini system instructions across all reply drafting and chat assistant interactions."
          className="border border-brand-500/20"
        >
          <form onSubmit={handleSaveBrand} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Brand / Company Name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />

              <Select
                label="Default Reply Tone"
                options={TONES.map((t) => ({ value: t.value, label: t.label }))}
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value)}
              />
            </div>

            <Textarea
              label="Brand Voice Guidelines"
              rows={3}
              placeholder="Describe tone characteristics (e.g. Warm, consultative, transparent, solution-focused)..."
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              required
            />

            <Input
              label="Forbidden Phrases (Comma-separated)"
              placeholder="e.g. impossible, not our fault, you should have known, as per policy"
              value={forbiddenPhrases}
              onChange={(e) => setForbiddenPhrases(e.target.value)}
              helperText="The Gemini AI is strictly instructed to avoid these expressions under any circumstance."
            />

            <Input
              label="Default Email / Ticket Signature"
              placeholder="e.g. The Acme Support Team"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              required
            />

            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />
              <span>
                Changes take effect immediately on all subsequent AI triage and reply generations.
              </span>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" variant="primary" size="md" loading={savingBrand} icon={Save}>
                Save Brand Settings
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
