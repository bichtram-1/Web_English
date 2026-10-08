import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useDragControls, useAnimation } from 'framer-motion';
import {
  Sparkles,
  Bot,
  X,
  Send,
  RotateCcw,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Trophy,
  Check,
  Info,
  Lightbulb,
  Search,
  PenTool,
  Volume2,
  GripHorizontal,
  Copy,
  Maximize2,
  Minimize2,
  Pin,
} from 'lucide-react';
import { aiApi, CefrAssessmentResult, TutorChatResponse } from '../../api/aiApi';
import { getDeckDetailRoute } from '../../constants/routers';
import { useAuth } from '../../contexts/AuthContext';
import { GeminiMarkdownRenderer } from './GeminiMarkdownRenderer';

interface MessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  correctedSentence?: string;
  grammarTip?: string;
  isAssessmentResult?: boolean;
  assessmentData?: CefrAssessmentResult;
  timestamp: string;
}

export default function FloatingAiTutor() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const dragControls = useDragControls();
  const controls = useAnimation();

  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Default: compact & draggable
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'chat'>('assessment');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;
    let success = false;

    // 1. Try modern navigator.clipboard API
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (err) {
        console.warn('navigator.clipboard.writeText failed, trying fallback:', err);
      }
    }

    // 2. Reliable fallback for non-secure HTTP origins / local dev / mobile
    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '2em';
        textarea.style.height = '2em';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {
        console.error('Fallback execCommand copy failed:', e);
      }
    }

    return success;
  };

  const getMessageCopyText = (msg: MessageItem): string => {
    let text = msg.content;
    if (msg.correctedSentence) {
      text += `\n\n${t('tutor_suggestion_title')}\n"${msg.correctedSentence}"`;
      if (msg.grammarTip) {
        text += `\n(${msg.grammarTip})`;
      }
    }
    if (msg.isAssessmentResult && msg.assessmentData) {
      text += `\n\n${t('tutor_achieved_level')} ${msg.assessmentData.cefrLevel} - ${msg.assessmentData.levelTitle}\n${msg.assessmentData.summary}`;
      if (msg.assessmentData.strengths && msg.assessmentData.strengths.length > 0) {
        text += `\n- ${t('tutor_strength_badge')}: ${msg.assessmentData.strengths.join(', ')}`;
      }
      if (msg.assessmentData.weaknesses && msg.assessmentData.weaknesses.length > 0) {
        text += `\n- ${t('tutor_weakness_badge')}: ${msg.assessmentData.weaknesses.join(', ')}`;
      }
    }
    return text;
  };

  const handleCopyMessage = async (msg: MessageItem) => {
    const text = getMessageCopyText(msg);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const handleCopySingleText = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  // Assessment flow state: 0 = Q1, 1 = Q2, 2 = Q3, 3 = Completed
  const [assessmentStep, setAssessmentStep] = useState<number>(0);

  // User CEFR Level: null if learner hasn't taken the test or is logged out!
  const [userCefrLevel, setUserCefrLevel] = useState<string | null>(null);

  // Sync CEFR level with authenticated user session
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUserCefrLevel(null);
      if (localStorage.getItem('lingualeap_user_cefr')) {
        localStorage.removeItem('lingualeap_user_cefr');
      }
    } else {
      const userKey = `lingualeap_user_cefr_${user.id}`;
      const savedLevel = localStorage.getItem(userKey) || localStorage.getItem('lingualeap_user_cefr') || null;
      setUserCefrLevel(savedLevel);
    }
  }, [isAuthenticated, user]);

  // Messages per tab
  const [assessmentMessages, setAssessmentMessages] = useState<MessageItem[]>([]);
  const [chatMessages, setChatMessages] = useState<MessageItem[]>([]);

  const compactMessagesEndRef = useRef<HTMLDivElement>(null);
  const expandedMessagesEndRef = useRef<HTMLDivElement>(null);
  const compactInputRef = useRef<HTMLInputElement>(null);
  const expandedInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (isExpanded) {
      expandedMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      compactMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [assessmentMessages, chatMessages, isOpen, activeTab, isExpanded]);

  // Handle escape key to collapse expanded mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isExpanded) {
          setIsExpanded(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Focus input when expand state changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (isExpanded) {
          expandedInputRef.current?.focus();
        } else {
          compactInputRef.current?.focus();
        }
      }, 80);
    }
  }, [isOpen, isExpanded]);

  // Initial Assessment Greeting & Initial Chat Greeting
  useEffect(() => {
    if (assessmentMessages.length === 0) {
      setAssessmentMessages([
        {
          id: 'welcome-q1',
          role: 'model',
          content: t('tutor_welcome_assessment'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }

    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'chat-welcome',
          role: 'model',
          content: t('tutor_welcome_chat'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, []);

  // Sync greetings when user switches language if only initial messages are present
  useEffect(() => {
    setAssessmentMessages((prev) => {
      if (prev.length === 1 && prev[0].id.startsWith('welcome-q1')) {
        return [
          {
            ...prev[0],
            content: t('tutor_welcome_assessment'),
          },
        ];
      }
      return prev;
    });

    setChatMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'chat-welcome') {
        return [
          {
            ...prev[0],
            content: t('tutor_welcome_chat'),
          },
        ];
      }
      return prev;
    });
  }, [i18n.language, t]);

  // Calculate drag boundaries to ensure widget stays safely within the visible screen
  const calculateDragBounds = (openState: boolean) => {
    if (typeof window === 'undefined') return { left: 0, right: 0, top: 0, bottom: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isSm = vw >= 640;
    const isMd = vw >= 768;
    const baseLeft = isSm ? 24 : 16;
    const baseBottom = isMd ? 24 : 80;

    const modalW = isSm ? 420 : Math.round(vw * 0.94);
    const modalH = Math.min(580, Math.round(vh * 0.75));
    const currentW = openState ? modalW : 160;
    const totalH = openState ? modalH + 10 + 46 : 46;

    const minX = 8 - baseLeft;
    const maxX = Math.max(minX, vw - 8 - baseLeft - currentW);
    const minY = Math.min(0, 8 - (vh - baseBottom - totalH));
    const maxY = Math.max(minY, baseBottom - 8);

    return {
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY,
    };
  };

  const [dragBounds, setDragBounds] = useState(() => calculateDragBounds(false));

  useEffect(() => {
    const handleResize = () => {
      setDragBounds(calculateDragBounds(isOpen));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Center the modal smoothly in the viewport
  const centerWidget = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isSm = vw >= 640;
    const isMd = vw >= 768;
    const baseLeft = isSm ? 24 : 16;
    const baseBottom = isMd ? 24 : 80;

    const modalW = isSm ? 420 : Math.round(vw * 0.94);
    const modalH = Math.min(580, Math.round(vh * 0.75));
    const modalMarginBottom = 10;
    const launcherHeight = 46;

    const targetX = Math.round((vw - modalW) / 2 - baseLeft);
    const initialModalCenterY = vh - baseBottom - modalH / 2 - modalMarginBottom - launcherHeight;
    const targetY = Math.round(vh / 2 - initialModalCenterY);

    controls.start({
      x: targetX,
      y: targetY,
      transition: { type: 'spring', damping: 25, stiffness: 220 },
    });
  }, [controls]);

  // Listen to open-ai-tutor event from Mascot Companion (Học giả Gà)
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
      setIsExpanded(false);
      setTimeout(() => {
        centerWidget();
      }, 50);
    };
    window.addEventListener('open-ai-tutor', handleOpenEvent);
    return () => window.removeEventListener('open-ai-tutor', handleOpenEvent);
  }, [centerWidget]);

  // Handle Send Message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setInputMessage('');
    const userMsgId = `user-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: MessageItem = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: userTimestamp,
    };

    const currentLang: 'en' | 'vi' = i18n.language === 'en' ? 'en' : 'vi';

    if (activeTab === 'assessment') {
      const updatedMessages = [...assessmentMessages, newUserMsg];
      setAssessmentMessages(updatedMessages);
      setIsLoading(true);

      const nextStep = assessmentStep + 1;

      try {
        const payload = {
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: 'assessment' as const,
          assessmentStep: nextStep,
          lang: currentLang,
        };

        const res: TutorChatResponse = await aiApi.tutorChat(payload);

        if (res.isAssessmentComplete && res.assessmentResult) {
          // Assessment Complete!
          setAssessmentStep(3);
          const assessedLevel = res.assessmentResult.cefrLevel;
          if (isAuthenticated && user?.id) {
            setUserCefrLevel(assessedLevel);
            localStorage.setItem(`lingualeap_user_cefr_${user.id}`, assessedLevel);
            localStorage.setItem('lingualeap_user_cefr', assessedLevel);
          } else {
            setUserCefrLevel(null);
            localStorage.removeItem('lingualeap_user_cefr');
          }

          setAssessmentMessages((prev) => [
            ...prev,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              content: res.reply,
              isAssessmentResult: true,
              assessmentData: res.assessmentResult,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          // Next Question
          setAssessmentStep(nextStep);
          setAssessmentMessages((prev) => [
            ...prev,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              content: res.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (err) {
        console.error('Tutor chat error:', err);
        setAssessmentMessages((prev) => [
          ...prev,
          {
            id: `model-err-${Date.now()}`,
            role: 'model',
            content: t('tutor_err_network'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Free Chat Tutor
      const updatedMessages = [...chatMessages, newUserMsg];
      setChatMessages(updatedMessages);
      setIsLoading(true);

      try {
        const payload = {
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: 'chat' as const,
          userLevel: userCefrLevel || 'Intermediate',
          lang: currentLang,
        };

        const res: TutorChatResponse = await aiApi.tutorChat(payload);

        setChatMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            content: res.reply,
            correctedSentence: res.correctedSentence,
            grammarTip: res.grammarTip,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } catch (err) {
        console.error('Chat error:', err);
        setChatMessages((prev) => [
          ...prev,
          {
            id: `model-err-${Date.now()}`,
            role: 'model',
            content: t('tutor_err_tutor_chat'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResetAssessment = () => {
    setAssessmentStep(0);
    setUserCefrLevel(null);
    if (user?.id) {
      localStorage.removeItem(`lingualeap_user_cefr_${user.id}`);
    }
    localStorage.removeItem('lingualeap_user_cefr');
    setAssessmentMessages([
      {
        id: `welcome-q1-${Date.now()}`,
        role: 'model',
        content: t('tutor_welcome_assessment'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleStudyDeck = (deckId: string) => {
    setIsOpen(false);
    setIsExpanded(false);
    navigate(getDeckDetailRoute(deckId));
  };

  const handleQuickAction = (actionType: 'explain' | 'grammar' | 'speak' | 'tips') => {
    if (actionType === 'explain') {
      handleSendMessage(t('tutor_chip_vocab_prompt'));
    } else if (actionType === 'grammar') {
      setInputMessage(t('tutor_chip_grammar_prefix'));
      if (isExpanded) {
        expandedInputRef.current?.focus();
      } else {
        compactInputRef.current?.focus();
      }
    } else if (actionType === 'speak') {
      handleSendMessage(t('tutor_chip_speak_prompt'));
    } else if (actionType === 'tips') {
      handleSendMessage(t('tutor_chip_tips_prompt'));
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false); // Reset to compact mode on close
  };

  const currentMessages = activeTab === 'assessment' ? assessmentMessages : chatMessages;

  // ========================================================
  // REUSABLE CHAT MODAL CONTENT RENDERER
  // ========================================================
  const renderChatContent = (isExpandedMode: boolean) => {
    return (
      <div className="flex flex-col h-full w-full select-text">
        {/* Header */}
        <div
          {...(!isExpandedMode ? { onPointerDown: (e: React.PointerEvent) => dragControls.start(e) } : {})}
          className={`px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shrink-0 flex items-center justify-between border-b border-white/10 select-none ${
            isExpandedMode ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
          }`}
          title={isExpandedMode ? t('tutor_fixed_badge') : t('tutor_header_drag_tip')}
        >
          {/* Left: Avatar & Title & Fixed Badge */}
          <div className="flex items-center gap-2.5">
            {!isExpandedMode ? (
              <GripHorizontal
                size={16}
                className="text-violet-300 hover:text-white transition-colors shrink-0"
              />
            ) : (
              <div
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/20 text-white text-[10px] font-bold shadow-2xs"
                title={t('tutor_shrink_tip')}
              >
                <Pin size={11} className="text-amber-300" />
                <span>{t('tutor_fixed_badge')}</span>
              </div>
            )}
            <div className="relative w-8.5 h-8.5 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-xs shrink-0">
              <Sparkles size={17} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-700" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight">{t('tutor_bot_name')}</span>
                {userCefrLevel && (
                  <span
                    className="px-1.5 py-0.2 rounded-md bg-white/20 text-amber-200 text-[10px] font-bold"
                    title={t('tutor_cefr_badge_header_tip', { level: userCefrLevel })}
                  >
                    {userCefrLevel}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-violet-200 font-medium">{t('tutor_bot_subtitle')}</span>
            </div>
          </div>

          {/* Center: Switcher (stops drag propagation) */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center p-0.5 rounded-xl bg-black/25 backdrop-blur-sm border border-white/10"
          >
            <button
              type="button"
              onClick={() => setActiveTab('assessment')}
              title={t('tutor_tab_assessment_tip')}
              className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                activeTab === 'assessment'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-violet-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <GraduationCap size={15} />
              <span className="text-[11px] font-bold hidden sm:inline">{t('tutor_tab_assessment')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              title={t('tutor_tab_chat_tip')}
              className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                activeTab === 'chat'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-violet-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare size={15} />
              <span className="text-[11px] font-bold hidden sm:inline">{t('tutor_tab_chat')}</span>
            </button>
          </div>

          {/* Right: Actions (stops drag propagation) */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1"
          >
            {activeTab === 'assessment' && assessmentStep > 0 && (
              <button
                type="button"
                onClick={handleResetAssessment}
                title={t('tutor_reset_test_tip')}
                className="p-1.5 rounded-lg hover:bg-white/20 text-violet-200 hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw size={15} />
              </button>
            )}

            {/* Expand / Minimize Toggle Button */}
            <button
              type="button"
              onClick={handleToggleExpand}
              title={isExpandedMode ? t('tutor_shrink_tip') : t('tutor_expand_tip')}
              className="p-1.5 rounded-lg hover:bg-white/20 text-violet-200 hover:text-white transition-all cursor-pointer"
              aria-label={isExpandedMode ? t('tutor_shrink_btn') : t('tutor_expand_btn')}
            >
              {isExpandedMode ? <Minimize2 size={16} /> : <Maximize2 size={15} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              title={t('tutor_minimize_tip')}
              className="p-1.5 rounded-lg hover:bg-white/20 text-violet-200 hover:text-white transition-all cursor-pointer"
              aria-label={t('tutor_minimize_tip')}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Assessment Progress: Visual 3-Node Stepper */}
        {activeTab === 'assessment' && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="px-4 py-2 bg-indigo-50/70 dark:bg-slate-800/60 border-b border-indigo-100/60 dark:border-slate-800 flex items-center justify-between text-xs"
          >
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {assessmentStep >= 3 ? t('tutor_progress_result') : t('tutor_progress_step', { step: assessmentStep + 1 })}
            </span>

            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((stepIdx) => {
                const isDone = assessmentStep > stepIdx;
                const isCurrent = assessmentStep === stepIdx;
                const stepTitles = [
                  t('tutor_step_1_title'),
                  t('tutor_step_2_title'),
                  t('tutor_step_3_title'),
                ];
                return (
                  <div
                    key={stepIdx}
                    title={stepTitles[stepIdx]}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all cursor-default ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40 scale-105'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isDone ? <Check size={11} /> : stepIdx + 1}
                  </div>
                );
              })}

              <div
                title={t('tutor_step_result_title')}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all cursor-default ${
                  assessmentStep >= 3
                    ? 'bg-amber-500 text-white ring-2 ring-amber-400/40 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                <Trophy size={11} />
              </div>
            </div>
          </div>
        )}

        {/* Chat Body (stops drag propagation to allow smooth scrolling and text selection) */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex-1 overflow-y-auto p-4 space-y-3.5 select-text divide-y divide-transparent ${
            isExpandedMode ? 'px-6 sm:px-8 py-5 space-y-4' : ''
          }`}
        >
          {currentMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group select-text`}
              >
                <div
                  className={`rounded-2xl p-3.5 leading-relaxed select-text cursor-text ${
                    isExpandedMode ? 'max-w-[85%] text-sm p-4' : 'max-w-[90%] text-xs p-3'
                  } ${
                    isUser
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-500/10 font-medium'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60 shadow-xs'
                  }`}
                >
                  {/* Gemini-Styled Message Content (Headings, bold, bullets, code, IPA) */}
                  <GeminiMarkdownRenderer
                    content={msg.content}
                    isUser={isUser}
                    className={isExpandedMode ? 'text-sm' : 'text-xs'}
                  />

                  {/* Grammar Correction Box (Compact & Informative) */}
                  {msg.correctedSentence && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs select-text">
                      <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-bold text-[11px] mb-1 select-none">
                        <span className="flex items-center gap-1">
                          <Sparkles size={11} />
                          <span>{t('tutor_suggestion_title')}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {msg.grammarTip && (
                            <span
                              className="cursor-help flex items-center gap-0.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                              title={msg.grammarTip}
                            >
                              <Info size={12} />
                              <span className="text-[10px]">{t('tutor_explanation_label')}</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopySingleText(`corr-${msg.id}`, msg.correctedSentence!)}
                            className="px-1.5 py-0.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                            title={copiedMsgId === `corr-${msg.id}` ? t('tutor_copied_btn') : t('tutor_copy_btn')}
                          >
                            {copiedMsgId === `corr-${msg.id}` ? (
                              <>
                                <Check size={10} className="text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">{t('tutor_copied_btn')}</span>
                              </>
                            ) : (
                              <>
                                <Copy size={10} />
                                <span>{t('tutor_copy_btn')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400 italic select-text">
                        "{msg.correctedSentence}"
                      </p>
                    </div>
                  )}

                  {/* Assessment Result Card (Special CEFR Summary) */}
                  {msg.isAssessmentResult && msg.assessmentData && (
                    <div className="mt-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 shadow-md space-y-3 select-text">
                      {/* Level Badge Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 select-none">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {t('tutor_achieved_level')}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                              {msg.assessmentData.cefrLevel}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {msg.assessmentData.levelTitle}
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                          <Trophy size={20} />
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-normal select-text">
                        {msg.assessmentData.summary}
                      </p>

                      {/* Strengths & Weaknesses (Compact Chips) */}
                      <div className="space-y-1.5 select-text">
                        <div className="flex flex-wrap gap-1">
                          {msg.assessmentData.strengths.map((s, idx) => (
                            <span
                              key={`str-${idx}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-medium select-text"
                              title={t('tutor_strength_badge')}
                            >
                              <CheckCircle2 size={10} className="shrink-0" />
                              <span>{s}</span>
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {msg.assessmentData.weaknesses.map((w, idx) => (
                            <span
                              key={`weak-${idx}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-medium select-text"
                              title={t('tutor_weakness_badge')}
                            >
                              <Info size={10} className="shrink-0" />
                              <span>{w}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Decks */}
                      {msg.assessmentData.recommendedDecks &&
                        msg.assessmentData.recommendedDecks.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 select-none">
                            <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                              <BookOpen size={12} />
                              <span>{t('tutor_recommended_decks')}</span>
                            </p>
                            {msg.assessmentData.recommendedDecks.map((deck) => (
                              <div
                                key={deck.id}
                                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 select-text">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {deck.title}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    {t('tutor_deck_summary', { count: deck.itemCount, category: deck.category })}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleStudyDeck(deck.id)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                                  title={t('tutor_btn_study_tip')}
                                >
                                  <span>{t('tutor_btn_study')}</span>
                                  <ArrowRight size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Switch to Free Chat Button */}
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="w-full mt-1.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer select-none"
                      >
                        <MessageSquare size={13} />
                        <span>{t('tutor_btn_chat_ai')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Timestamp and Copy Action */}
                <div className="flex items-center justify-between w-full mt-1 px-1 select-none">
                  <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg)}
                    className={`p-1 px-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                      copiedMsgId === msg.id
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 font-semibold'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                    title={copiedMsgId === msg.id ? t('tutor_copied_btn') : t('tutor_copy_btn')}
                  >
                    {copiedMsgId === msg.id ? (
                      <>
                        <Check size={11} className="text-emerald-500" />
                        <span>{t('tutor_copied_btn')}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>{t('tutor_copy_btn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 w-fit text-xs animate-pulse">
              <Bot size={15} className="animate-spin text-indigo-600" />
              <span>{t('tutor_loading')}</span>
            </div>
          )}

          <div ref={isExpandedMode ? expandedMessagesEndRef : compactMessagesEndRef} />
        </div>

        {/* Quick Action Chips (Chat Mode) */}
        {activeTab === 'chat' && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className={`px-3 py-1.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap no-scrollbar ${
              isExpandedMode ? 'px-6 py-2 gap-2 text-xs' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => handleQuickAction('explain')}
              title={t('tutor_chip_vocab_tip')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-indigo-400 text-slate-600 dark:text-slate-300 font-medium cursor-pointer flex items-center gap-1 transition-all"
            >
              <Search size={11} className="text-indigo-500" />
              <span>{t('tutor_chip_vocab')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('grammar')}
              title={t('tutor_chip_grammar_tip')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-indigo-400 text-slate-600 dark:text-slate-300 font-medium cursor-pointer flex items-center gap-1 transition-all"
            >
              <PenTool size={11} className="text-amber-500" />
              <span>{t('tutor_chip_grammar')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('speak')}
              title={t('tutor_chip_speak_tip')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-indigo-400 text-slate-600 dark:text-slate-300 font-medium cursor-pointer flex items-center gap-1 transition-all"
            >
              <Volume2 size={11} className="text-emerald-500" />
              <span>{t('tutor_chip_speak')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('tips')}
              title={t('tutor_chip_tips_tip')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-indigo-400 text-slate-600 dark:text-slate-300 font-medium cursor-pointer flex items-center gap-1 transition-all"
            >
              <Lightbulb size={11} className="text-yellow-500" />
              <span>{t('tutor_chip_tips')}</span>
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onPointerDown={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className={`p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 ${
            isExpandedMode ? 'p-3.5 px-6 sm:px-8 gap-3' : ''
          }`}
        >
          <input
            ref={isExpandedMode ? expandedInputRef : compactInputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              activeTab === 'assessment'
                ? t('tutor_placeholder_assessment')
                : t('tutor_placeholder_chat')
            }
            disabled={isLoading || (activeTab === 'assessment' && assessmentStep >= 3)}
            className={`flex-1 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 ${
              isExpandedMode ? 'py-2.5 px-4 text-sm' : 'text-xs'
            }`}
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className={`rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
              isExpandedMode ? 'w-10 h-10' : 'w-8.5 h-8.5'
            }`}
            aria-label={t('tutor_btn_send_tip')}
            title={t('tutor_btn_send_tip')}
          >
            <Send size={isExpandedMode ? 16 : 14} />
          </button>
        </form>
      </div>
    );
  };

  return (
    <>
      {/* 1. COMPACT DRAGGABLE FLOATING WIDGET (Default mode) */}
      <motion.div
        drag={!isExpanded}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.06}
        dragConstraints={dragBounds}
        animate={controls}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setTimeout(() => setIsDragging(false), 80);
        }}
        whileDrag={{ scale: 1.01 }}
        className={`fixed bottom-20 md:bottom-6 left-4 sm:left-6 z-40 flex flex-col items-start pointer-events-none transition-opacity duration-200 ${
          isExpanded ? 'opacity-0 pointer-events-none' : ''
        }`}
      >
        {/* Compact Modal / Drawer (Above Launcher) */}
        <AnimatePresence>
          {isOpen && !isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-auto mb-2.5 w-[94vw] sm:w-[420px] h-[580px] max-h-[75vh] flex flex-col rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-indigo-950/25 select-text"
            >
              {renderChatContent(false)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Launcher Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onPointerDown={(e) => dragControls.start(e)}
            onClick={() => {
              if (!isDragging) {
                setIsOpen((prev) => !prev);
                if (isExpanded) setIsExpanded(false);
              }
            }}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-xl transition-all cursor-grab active:cursor-grabbing border ${
              isOpen
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700 shadow-slate-900/30'
                : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white border-violet-400/40 shadow-indigo-500/30 hover:shadow-indigo-500/50'
            }`}
            aria-label="Toggle AI Tutor"
            title={isOpen ? t('tutor_launcher_close_tip') : t('tutor_launcher_open_tip')}
          >
            {/* Animated Bot Icon */}
            <div className="relative">
              <Bot size={20} className="shrink-0" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
            </div>

            {/* Compact Label */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight">
                {isOpen ? t('tutor_launcher_close_btn') : t('tutor_launcher_open_btn')}
              </span>
              {userCefrLevel && (
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-amber-200 font-bold"
                  title={t('tutor_cefr_badge_tip', { level: userCefrLevel })}
                >
                  {userCefrLevel}
                </span>
              )}
            </div>

            {/* Drag grip icon */}
            <GripHorizontal size={13} className="text-white/60 hover:text-white shrink-0 ml-0.5" />
          </motion.button>
        </div>
      </motion.div>

      {/* 2. EXPANDED FIXED MODAL (Phóng to & Cố định vị trí, không cho di chuyển) */}
      <AnimatePresence>
        {isOpen && isExpanded && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-slate-950/45 backdrop-blur-xs pointer-events-auto select-text"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsExpanded(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-4xl lg:max-w-5xl h-[88vh] max-h-[860px] flex flex-col rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-indigo-950/35 select-text"
            >
              {renderChatContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
