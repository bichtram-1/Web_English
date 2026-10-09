import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { aiApi, CefrAssessmentResult, TutorChatResponse } from '../api/aiApi';

export interface CurrentCardContext {
  type: 'flashcard' | 'drag_drop';
  term?: string;
  meaning?: string;
  phonetic?: string;
  exampleEn?: string;
  exampleVi?: string;
  grammarRule?: string;
  grammarExplanation?: string;
}

export interface MessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  correctedSentence?: string;
  grammarTip?: string;
  isAssessmentResult?: boolean;
  assessmentData?: CefrAssessmentResult;
  timestamp: string;
}

export interface AiTutorContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: 'assessment' | 'chat';
  setActiveTab: React.Dispatch<React.SetStateAction<'assessment' | 'chat'>>;
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  assessmentMessages: MessageItem[];
  setAssessmentMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  chatMessages: MessageItem[];
  setChatMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  assessmentStep: number;
  setAssessmentStep: React.Dispatch<React.SetStateAction<number>>;
  userCefrLevel: string | null;
  setUserCefrLevel: React.Dispatch<React.SetStateAction<string | null>>;
  currentCardContext: CurrentCardContext | null;
  setCurrentCardContext: React.Dispatch<React.SetStateAction<CurrentCardContext | null>>;
  handleSendMessage: (customText?: string) => Promise<void>;
  handleResetAssessment: () => void;
  handleResetChat: () => void;
  openTutor: (options?: { tab?: 'assessment' | 'chat'; prompt?: string }) => void;
  closeTutor: () => void;
}

const AiTutorContext = createContext<AiTutorContextType | undefined>(undefined);

const getChatStorageKey = (userId?: string) => `lingualeap_tutor_chat_${userId || 'guest'}`;
const getAssessmentStorageKey = (userId?: string) => `lingualeap_tutor_assessment_${userId || 'guest'}`;
const getStepStorageKey = (userId?: string) => `lingualeap_tutor_step_${userId || 'guest'}`;
const getTabStorageKey = (userId?: string) => `lingualeap_tutor_tab_${userId || 'guest'}`;
const getDraftStorageKey = (userId?: string) => `lingualeap_tutor_draft_${userId || 'guest'}`;
const getOpenStorageKey = (userId?: string) => `lingualeap_tutor_open_${userId || 'guest'}`;

export const AiTutorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  // Widget visibility & expansion state (persisted across navigation)
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(getOpenStorageKey(user?.id));
      return saved === 'true';
    } catch {}
    return false;
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'assessment' | 'chat'>(() => {
    try {
      const saved = localStorage.getItem(getTabStorageKey(user?.id));
      if (saved === 'assessment' || saved === 'chat') return saved;
    } catch {}
    return 'assessment';
  });

  // Draft message currently typed in the input
  const [inputMessage, setInputMessage] = useState<string>(() => {
    try {
      return localStorage.getItem(getDraftStorageKey(user?.id)) || '';
    } catch {}
    return '';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Assessment flow: 0 = Q1, 1 = Q2, 2 = Q3, 3 = Completed
  const [assessmentStep, setAssessmentStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(getStepStorageKey(user?.id));
      if (saved !== null) return parseInt(saved, 10) || 0;
    } catch {}
    return 0;
  });

  // User CEFR Level
  const [userCefrLevel, setUserCefrLevel] = useState<string | null>(() => {
    try {
      if (user?.id) {
        return localStorage.getItem(`lingualeap_user_cefr_${user.id}`) || localStorage.getItem('lingualeap_user_cefr') || null;
      }
    } catch {}
    return null;
  });

  // Card learning context provided by StudyPage or flashcards
  const [currentCardContext, setCurrentCardContext] = useState<CurrentCardContext | null>(null);

  // Chat messages with AI Tutor
  const [chatMessages, setChatMessages] = useState<MessageItem[]>(() => {
    try {
      const saved = localStorage.getItem(getChatStorageKey(user?.id));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // Assessment messages
  const [assessmentMessages, setAssessmentMessages] = useState<MessageItem[]>(() => {
    try {
      const saved = localStorage.getItem(getAssessmentStorageKey(user?.id));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

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

  // Persist open state
  useEffect(() => {
    try {
      localStorage.setItem(getOpenStorageKey(user?.id), String(isOpen));
    } catch {}
  }, [isOpen, user?.id]);

  // Persist activeTab
  useEffect(() => {
    try {
      localStorage.setItem(getTabStorageKey(user?.id), activeTab);
    } catch {}
  }, [activeTab, user?.id]);

  // Persist assessmentStep
  useEffect(() => {
    try {
      localStorage.setItem(getStepStorageKey(user?.id), String(assessmentStep));
    } catch {}
  }, [assessmentStep, user?.id]);

  // Persist inputMessage draft
  useEffect(() => {
    try {
      if (inputMessage) {
        localStorage.setItem(getDraftStorageKey(user?.id), inputMessage);
      } else {
        localStorage.removeItem(getDraftStorageKey(user?.id));
      }
    } catch {}
  }, [inputMessage, user?.id]);

  // Persist chatMessages
  useEffect(() => {
    try {
      if (chatMessages.length > 0) {
        localStorage.setItem(getChatStorageKey(user?.id), JSON.stringify(chatMessages));
      }
    } catch (e) {
      console.warn('Failed to save chat messages:', e);
    }
  }, [chatMessages, user?.id]);

  // Persist assessmentMessages
  useEffect(() => {
    try {
      if (assessmentMessages.length > 0) {
        localStorage.setItem(getAssessmentStorageKey(user?.id), JSON.stringify(assessmentMessages));
      }
    } catch (e) {
      console.warn('Failed to save assessment messages:', e);
    }
  }, [assessmentMessages, user?.id]);

  // Switch / reload messages when user session changes
  useEffect(() => {
    const currentUserId = user?.id;
    try {
      const savedChat = localStorage.getItem(getChatStorageKey(currentUserId));
      if (savedChat) {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed);
        } else {
          setChatMessages([
            {
              id: 'chat-welcome',
              role: 'model',
              content: t('tutor_welcome_chat'),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } else {
        setChatMessages([
          {
            id: 'chat-welcome',
            role: 'model',
            content: t('tutor_welcome_chat'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }

      const savedAssess = localStorage.getItem(getAssessmentStorageKey(currentUserId));
      if (savedAssess) {
        const parsed = JSON.parse(savedAssess);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssessmentMessages(parsed);
        } else {
          setAssessmentMessages([
            {
              id: 'welcome-q1',
              role: 'model',
              content: t('tutor_welcome_assessment'),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } else {
        setAssessmentMessages([
          {
            id: 'welcome-q1',
            role: 'model',
            content: t('tutor_welcome_assessment'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }

      const savedStep = localStorage.getItem(getStepStorageKey(currentUserId));
      setAssessmentStep(savedStep !== null ? parseInt(savedStep, 10) || 0 : 0);

      const savedDraft = localStorage.getItem(getDraftStorageKey(currentUserId));
      setInputMessage(savedDraft || '');
    } catch (e) {
      console.warn('Error loading tutor data for user:', e);
    }
  }, [user?.id, t]);

  // Sync initial welcome messages if user switches language without custom conversation yet
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
      if (prev.length === 1 && prev[0].id.startsWith('chat-welcome')) {
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

  // Reset assessment
  const handleResetAssessment = useCallback(() => {
    const userKey = user?.id;
    setAssessmentStep(0);
    setUserCefrLevel(null);
    if (userKey) {
      localStorage.removeItem(`lingualeap_user_cefr_${userKey}`);
      localStorage.removeItem(getAssessmentStorageKey(userKey));
      localStorage.removeItem(getStepStorageKey(userKey));
    }
    localStorage.removeItem('lingualeap_user_cefr');
    localStorage.removeItem(getAssessmentStorageKey());
    localStorage.removeItem(getStepStorageKey());

    const initialWelcome: MessageItem = {
      id: `welcome-q1-${Date.now()}`,
      role: 'model',
      content: t('tutor_welcome_assessment'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAssessmentMessages([initialWelcome]);
  }, [user?.id, t]);

  // Reset free chat (Start new topic)
  const handleResetChat = useCallback(() => {
    const isVi = i18n.language === 'vi';
    const confirmMsg = isVi
      ? 'Bạn có chắc chắn muốn làm mới cuộc trò chuyện với Gia sư AI không?'
      : 'Are you sure you want to start a new chat with the AI Tutor?';
    if (!window.confirm(confirmMsg)) return;

    const initialWelcome: MessageItem = {
      id: `chat-welcome-${Date.now()}`,
      role: 'model',
      content: t('tutor_welcome_chat'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages([initialWelcome]);
    setInputMessage('');
    const userKey = user?.id;
    localStorage.removeItem(getChatStorageKey(userKey));
    localStorage.removeItem(getDraftStorageKey(userKey));
  }, [i18n.language, user?.id, t]);

  // Send message implementation
  const handleSendMessage = useCallback(
    async (customText?: string) => {
      const textToSend = (customText || inputMessage).trim();
      if (!textToSend || isLoading) return;

      setInputMessage('');
      try {
        localStorage.removeItem(getDraftStorageKey(user?.id));
      } catch {}

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
    },
    [inputMessage, isLoading, activeTab, assessmentMessages, assessmentStep, i18n.language, isAuthenticated, user, userCefrLevel, t, chatMessages]
  );

  const openTutor = useCallback(
    (options?: { tab?: 'assessment' | 'chat'; prompt?: string }) => {
      setIsOpen(true);
      setIsExpanded(false);
      if (options?.tab) {
        setActiveTab(options.tab);
      } else {
        setActiveTab('chat');
      }
      if (options?.prompt) {
        setTimeout(() => {
          handleSendMessage(options.prompt);
        }, 120);
      }
    },
    [handleSendMessage]
  );

  const closeTutor = useCallback(() => {
    setIsOpen(false);
    setIsExpanded(false);
  }, []);

  // Global event bridge
  useEffect(() => {
    const handleOpenEvent = (e?: any) => {
      openTutor({
        tab: e?.detail?.tab,
        prompt: e?.detail?.prompt,
      });
    };

    const handleCloseEvent = () => {
      closeTutor();
    };

    window.addEventListener('open-ai-tutor', handleOpenEvent);
    window.addEventListener('close-ai-tutor', handleCloseEvent);
    return () => {
      window.removeEventListener('open-ai-tutor', handleOpenEvent);
      window.removeEventListener('close-ai-tutor', handleCloseEvent);
    };
  }, [openTutor, closeTutor]);

  return (
    <AiTutorContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isExpanded,
        setIsExpanded,
        activeTab,
        setActiveTab,
        inputMessage,
        setInputMessage,
        isLoading,
        setIsLoading,
        assessmentMessages,
        setAssessmentMessages,
        chatMessages,
        setChatMessages,
        assessmentStep,
        setAssessmentStep,
        userCefrLevel,
        setUserCefrLevel,
        currentCardContext,
        setCurrentCardContext,
        handleSendMessage,
        handleResetAssessment,
        handleResetChat,
        openTutor,
        closeTutor,
      }}
    >
      {children}
    </AiTutorContext.Provider>
  );
};

export const useAiTutor = (): AiTutorContextType => {
  const context = useContext(AiTutorContext);
  if (!context) {
    throw new Error('useAiTutor must be used within an AiTutorProvider');
  }
  return context;
};
