import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Gamepad2,
  Leaf,
  PenLine,
  Users,
  Sparkles,
  ChevronRight,
  FolderPlus,
  Globe,
  Lock,
  Crown,
  Download,
  Star,
  Volume2,
  Layers,
  Search,
  Copy,
} from 'lucide-react';

import deckApi from '../../api/deckApi';
import { recordViewedDeck } from '../../utils/recentDecks';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/shared/Loading';
import AddToCollectionModal from '../../components/shared/AddToCollectionModal';
import ImportExportModal from '../../components/general/ImportExportModal';
import ItemOptionsMenu from '../../components/shared/ItemOptionsMenu';
import ConfirmDeleteModal from '../../components/shared/ConfirmDeleteModal';
import DeckRatingStars from '../../components/shared/DeckRatingStars';
import { isDeckCreator, canEditDeck } from '../../utils/permission';
import { getCategoryLabel } from '../home/HomePage';
import {
  ROUTES,
  getDeckDetailRoute,
  getEditDeckRoute,
  getStudyRoute,
  getTestRoute,
  getMinigameRoute,
  getZenRoute,
  getWrittenRoute,
  getMatchRoute,
  getTreasureRoute,
} from '../../constants/routers';
import type { Deck } from '../../types/DeckType';
import type { StudyMode } from '../../types/deck.types';

export default function DeckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cardSearch, setCardSearch] = useState('');

  const speakWord = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleCloneDeck = async () => {
    if (!isAuthenticated || !user) {
      navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
      return;
    }
    if (!deck) return;

    setIsCloning(true);
    try {
      const clonedDeck = await deckApi.createDeck({
        title: `${deck.title} (${isVi ? 'Bản sao' : 'Copy'})`,
        description: deck.description || '',
        category: deck.category || 'Beginner',
        color: deck.color || 'from-indigo-500 to-violet-600',
        isPublic: false,
        cards: deck.cards || [],
      });
      if (clonedDeck?.id) {
        navigate(getEditDeckRoute(clonedDeck.id));
      }
    } catch (e) {
      console.error('Failed to clone deck:', e);
      alert(isVi ? 'Không thể sao chép bộ thẻ. Vui lòng thử lại!' : 'Failed to clone deck. Please try again!');
    } finally {
      setIsCloning(false);
    }
  };

  const handleDeleteDeck = async () => {
    if (!deck) return;
    setIsDeleting(true);
    try {
      await deckApi.deleteDeck(deck.id);
      setIsDeleteModalOpen(false);
      navigate(ROUTES.HOME);
    } catch (e) {
      console.error('Error deleting deck:', e);
    } finally {
      setIsDeleting(false);
    }
  };


  useEffect(() => {
    if (!id) return;
    setLoading(true);
    deckApi.getDeckById(id).then((data) => {
      setDeck(data || null);
      if (data) {
        recordViewedDeck(data);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Loading />;

  if (!deck) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">{t('not_found')}</h2>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm cursor-pointer"
        >
          {t('go_home')}
        </button>
      </div>
    );
  }

  const modes = [
    {
      mode: 'flashcard' as StudyMode,
      label: t('deck_flashcard_label'),
      sublabel: t('deck_flashcard_sublabel'),
      icon: <BookOpen size={24} />,
      gradient: 'from-indigo-500 to-violet-600',
      tag: isVi ? 'Thẻ nhớ' : 'Flashcard',
    },
    {
      mode: 'treasure' as StudyMode,
      label: t('deck_treasure_label'),
      sublabel: t('deck_treasure_sublabel'),
      icon: <Crown size={24} />,
      gradient: 'from-amber-500 to-orange-500',
      tag: isVi ? 'Thám hiểm' : 'Adventure',
    },
    {
      mode: 'match' as StudyMode,
      label: t('deck_match_label'),
      sublabel: t('deck_match_sublabel'),
      icon: <Sparkles size={24} />,
      gradient: 'from-indigo-600 to-purple-600',
      tag: isVi ? 'Trí nhớ' : 'Memory',
    },
    {
      mode: 'test' as StudyMode,
      label: t('deck_test_label'),
      sublabel: t('deck_test_sublabel'),
      icon: <ClipboardList size={24} />,
      gradient: 'from-rose-500 to-orange-500',
      tag: isVi ? 'Trắc nghiệm' : 'Quiz',
    },
    {
      mode: 'minigame' as StudyMode,
      label: t('deck_minigame_label'),
      sublabel: t('deck_minigame_sublabel'),
      icon: <Gamepad2 size={24} />,
      gradient: 'from-cyan-500 to-blue-600',
      tag: isVi ? 'Tốc độ' : 'Speed',
    },
    {
      mode: 'zen' as StudyMode,
      label: t('deck_zen_label'),
      sublabel: t('deck_zen_sublabel'),
      icon: <Leaf size={24} />,
      gradient: 'from-emerald-400 to-teal-600',
      tag: isVi ? 'Thư giãn' : 'Zen',
    },
    {
      mode: 'written' as StudyMode,
      label: t('deck_written_label'),
      sublabel: t('deck_written_sublabel'),
      icon: <PenLine size={24} />,
      gradient: 'from-violet-500 to-purple-600',
      tag: isVi ? 'Chính tả' : 'Writing',
    },
  ];

  const flashcardCount = deck.cards.filter((c) => c.type === 'flashcard').length;
  const dragDropCount = deck.cards.filter((c) => c.type === 'drag_drop').length;

  const handleSelectMode = (mode: StudyMode) => {
    if (mode === 'flashcard') navigate(getStudyRoute(deck.id));
    else if (mode === 'treasure') navigate(getTreasureRoute(deck.id));
    else if (mode === 'match') navigate(getMatchRoute(deck.id));
    else if (mode === 'test') navigate(getTestRoute(deck.id));
    else if (mode === 'minigame') navigate(getMinigameRoute(deck.id));
    else if (mode === 'zen') navigate(getZenRoute(deck.id));
    else if (mode === 'written') navigate(getWrittenRoute(deck.id));
  };

  const isPublic = deck.isPublic !== undefined ? deck.isPublic : true;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero banner */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${deck.color}`}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <ArrowLeft size={15} />
              {t('nav_all_decks')}
            </button>

            <div className="flex items-center gap-2">
              {/* Export / Import button */}
              <button
                onClick={() => setIsImportExportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Download size={14} />
                <span>{isVi ? 'Xuất / Nhập File' : 'Export / Import'}</span>
              </button>

              {/* Clone deck for community users */}
              <button
                disabled={isCloning}
                onClick={handleCloneDeck}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                style={{ fontFamily: 'var(--font-display)' }}
                title={isVi ? 'Tạo bản sao để tự do chỉnh sửa theo ý bạn' : 'Clone this deck to your own library to edit'}
              >
                <Copy size={14} />
                <span>{isCloning ? (isVi ? 'Đang sao chép...' : 'Cloning...') : (isVi ? 'Sao chép bộ thẻ' : 'Clone Deck')}</span>
              </button>

              {/* Add to collection button */}
              <button
                onClick={() => setIsAddCollectionOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <FolderPlus size={14} />
                <span>{t('collection_add_to_collection')}</span>
              </button>


              {/* 3-dots Menu with permission check */}
              <ItemOptionsMenu
                onEdit={() => navigate(getEditDeckRoute(deck.id))}
                onDelete={() => setIsDeleteModalOpen(true)}
                canEdit={canEditDeck(deck, user)}
                canDelete={isDeckCreator(deck, user)}
                creatorName={deck.creator}
                isOwner={isDeckCreator(deck, user)}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1
                  className="text-white text-3xl md:text-4xl font-black mb-2 leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {deck.title}
                </h1>
                <div className="flex items-center gap-3 text-white/90 text-sm font-medium flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    {t('deck_creator_label')}: <strong className="text-white">{deck.creator}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={13} />
                    {t('cards_count', { count: deck.itemCount })}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-bold text-white">
                    {getCategoryLabel(deck.category, t)}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-bold text-white flex items-center gap-1">
                    {isPublic ? <Globe size={11} /> : <Lock size={11} />}
                    {isPublic ? t('deck_public_badge') : t('deck_private_badge')}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex gap-3 mt-5 flex-wrap">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black flex items-center justify-center gap-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Star size={18} className="fill-amber-300 text-amber-300" />
                  <span>{deck.rating ? deck.rating.toFixed(1) : '5.0'}</span>
                </div>
                <div className="text-white/80 text-xs font-semibold">
                  {deck.ratingCount ? `${deck.ratingCount} ${isVi ? 'đánh giá' : 'reviews'}` : (isVi ? 'Đánh giá' : 'Rating')}
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {flashcardCount}
                </div>
                <div className="text-white/80 text-xs font-semibold">{isVi ? 'Thẻ ghi nhớ' : 'Flashcards'}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {dragDropCount}
                </div>
                <div className="text-white/80 text-xs font-semibold">{isVi ? 'Kéo thả câu' : 'Drag & Drop'}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {modes.length}
                </div>
                <div className="text-white/80 text-xs font-semibold">{t('deck_detail_modes_count')}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Interactive Community Rating Bar */}
        <DeckRatingStars
          rating={deck.rating}
          ratingCount={deck.ratingCount}
          userRating={deck.userRatings?.[user?.id || user?.email || 'guest']}
          interactive={true}
          size="md"
          onRate={async (score) => {
            const updated = await deckApi.rateDeck(
              deck.id,
              score,
              user?.id || user?.email || 'guest'
            );
            setDeck(updated);
          }}
        />

        {/* Mode selection heading */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h2
              className="text-slate-900 dark:text-white text-base sm:text-lg font-black tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('deck_choose_mode')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              {isVi ? 'Chọn phương pháp học tương tác phù hợp với bạn' : 'Select an interactive mode to practice this deck'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modes.map((item, index) => (
            <motion.div
              key={item.mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => handleSelectMode(item.mode)}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform shrink-0`}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3
                      className="font-black text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.label}
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed line-clamp-1 sm:line-clamp-2">
                    {item.sublabel}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0 ml-1"
              />
            </motion.div>
          ))}
        </div>

        {/* Vocabulary Cards List Section */}
        {(() => {
          const cardsList = deck.cards || [];
          const filteredCards = cardsList.filter((c) => {
            if (!cardSearch.trim()) return true;
            const q = cardSearch.toLowerCase().trim();
            if (c.type === 'flashcard') {
              return (
                c.front.toLowerCase().includes(q) ||
                c.back.toLowerCase().includes(q) ||
                (c.phonetic && c.phonetic.toLowerCase().includes(q))
              );
            } else {
              return (
                c.meaning.toLowerCase().includes(q) ||
                (c.grammarRule && c.grammarRule.toLowerCase().includes(q))
              );
            }
          });

          return (
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-none shrink-0">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h2
                      className="text-slate-900 dark:text-white text-base sm:text-lg font-black tracking-tight leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {isVi ? `Danh sách từ vựng (${cardsList.length} thẻ)` : `Vocabulary Cards (${cardsList.length} cards)`}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {isVi ? 'Xem trước và nghe phát âm tất cả các thẻ trong bộ này' : 'Preview and listen to all cards in this deck'}
                    </p>
                  </div>
                </div>

                {cardsList.length > 3 && (
                  <div className="relative max-w-xs w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      placeholder={isVi ? 'Tìm kiếm thẻ...' : 'Search cards...'}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                )}
              </div>

              {cardsList.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
                  {isVi ? 'Bộ thẻ này chưa có thẻ từ vựng nào.' : 'This deck has no cards yet.'}
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
                  {isVi ? 'Không tìm thấy thẻ phù hợp với từ khóa.' : 'No cards match your search.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCards.map((c, index) => (
                    <div
                      key={c.id || index}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-xs flex items-center justify-between gap-4 group"
                    >
                      {c.type === 'flashcard' ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="font-black text-slate-900 dark:text-white text-base leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                                style={{ fontFamily: 'var(--font-display)' }}
                              >
                                {c.front}
                              </span>
                              {c.phonetic && (
                                <span className="text-xs text-indigo-500 dark:text-indigo-400 font-mono">
                                  {c.phonetic}
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                              {c.back}
                            </div>
                            {c.exampleEn && (
                              <div className="text-xs text-slate-400 dark:text-slate-500 italic mt-1 line-clamp-1">
                                "{c.exampleEn}"
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => speakWord(c.front)}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shrink-0"
                            title={isVi ? 'Nghe phát âm' : 'Listen pronunciation'}
                          >
                            <Volume2 size={18} />
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              {isVi ? 'Kéo thả ngữ pháp' : 'Grammar Drag & Drop'}
                            </span>
                            {c.grammarRule && (
                              <span className="text-xs text-indigo-500 font-mono font-bold">
                                {c.grammarRule}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {c.meaning}
                          </div>
                          {c.grammarExplanation && (
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                              {c.grammarExplanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        deck={deck}
        isOpen={isAddCollectionOpen}
        onClose={() => setIsAddCollectionOpen(false)}
      />

      {/* Import / Export Modal */}
      <ImportExportModal
        deck={deck}
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />

      {/* Delete Deck Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteDeck}
        title={isVi ? 'Xóa bộ thẻ từ vựng' : 'Delete Vocabulary Deck'}
        itemName={deck.title}
        description={
          isVi
            ? `Bạn có chắc chắn muốn xóa vĩnh viễn bộ thẻ "${deck.title}"? Toàn bộ danh sách ${deck.itemCount} thẻ từ vựng sẽ bị xóa.`
            : `Are you sure you want to permanently delete the deck "${deck.title}"? All ${deck.itemCount} cards will be removed.`
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}
