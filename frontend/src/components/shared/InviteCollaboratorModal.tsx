import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  UserPlus,
  Mail,
  Shield,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Eye,
  PenTool,
  Globe,
  Lock,
} from 'lucide-react';
import collectionApi from '../../api/collectionApi';
import { useAuth } from '../../hooks/useAuth';
import type { DeckCollection, CollaboratorRole } from '../../types/DeckType';

interface InviteCollaboratorModalProps {
  collection: DeckCollection;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCollection: (updated: DeckCollection) => void;
}

export default function InviteCollaboratorModal({
  collection,
  isOpen,
  onClose,
  onUpdateCollection,
}: InviteCollaboratorModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('viewer');
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const isOwner = user?.id && collection.creatorId === user.id;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const updated = await collectionApi.inviteCollaborator(collection.id, {
      email: email.trim(),
      role,
    });

    if (updated) {
      onUpdateCollection(updated);
      setEmail('');
      showToast(t('collection_added_toast'));
    }
  };

  const handleRoleChange = async (targetEmail: string, newRole: CollaboratorRole) => {
    const updated = await collectionApi.updateCollaboratorRole(collection.id, targetEmail, newRole);
    if (updated) {
      onUpdateCollection(updated);
      showToast('Đã cập nhật quyền hạn thành công!');
    }
  };

  const handleRemoveMember = async (targetEmail: string) => {
    if (!window.confirm(t('invite_remove_confirm'))) return;
    const updated = await collectionApi.removeCollaborator(collection.id, targetEmail);
    if (updated) {
      onUpdateCollection(updated);
      showToast(t('collection_removed_toast'));
    }
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/collections/${collection.id}?join=true&role=${role}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    showToast(t('invite_link_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const collaborators = collection.collaborators || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {t('invite_collaborator_title')}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[280px]">
                    "{collection.title}"
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Toast feedback */}
            {toastMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center"
              >
                {toastMsg}
              </motion.div>
            )}

            {/* Invite Form */}
            <form onSubmit={handleInvite} className="flex flex-col gap-3.5 bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('invite_email_label')} *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('invite_email_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('invite_permission_label')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('viewer')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      role === 'viewer'
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-300 dark:ring-indigo-800'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <Eye size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{t('invite_role_viewer')}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                      {t('invite_role_viewer_desc')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('editor')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      role === 'editor'
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-300 dark:ring-indigo-800'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <PenTool size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{t('invite_role_editor')}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                      {t('invite_role_editor_desc')}
                    </p>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{t('invite_copy_link')}</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <UserPlus size={14} />
                  <span>{t('invite_send_btn')}</span>
                </button>
              </div>
            </form>

            {/* List of Active Members */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>{t('invite_members_list')}</span>
                  <span className="text-slate-400 font-bold">({collaborators.length + 1})</span>
                </h4>
              </div>

              <div className="space-y-2">
                {/* Author row */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {collection.creator.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{collection.creator}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-200 dark:border-indigo-800">
                          {t('invite_author_badge')}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">Chủ sở hữu danh sách</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    Toàn quyền
                  </span>
                </div>

                {/* Collaborators */}
                {collaborators.map((c) => (
                  <div
                    key={c.email}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.name ? c.name.charAt(0).toUpperCase() : c.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {c.name || c.email}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {c.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner ? (
                        <select
                          value={c.role}
                          onChange={(e) => handleRoleChange(c.email, e.target.value as CollaboratorRole)}
                          className="text-xs font-bold py-1 px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="viewer">{t('invite_member_role_viewer')}</option>
                          <option value="editor">{t('invite_member_role_editor')}</option>
                        </select>
                      ) : (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            c.role === 'editor'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {c.role === 'editor' ? t('invite_member_role_editor') : t('invite_member_role_viewer')}
                        </span>
                      )}

                      {isOwner && (
                        <button
                          onClick={() => handleRemoveMember(c.email)}
                          title={t('invite_remove_member')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
