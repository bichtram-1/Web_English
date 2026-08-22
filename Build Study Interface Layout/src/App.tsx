import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Loading from './components/shared/Loading';
import DefaultLayout from './components/layout/DefaultLayout';
import AuthLayout from './components/layout/AuthLayout';
import PageNotFound from './components/general/PageNotFound';
import { ROUTES } from './constants/routers';

// Lazy loading pages following DATN architecture pattern
const HomePage = lazy(() => import('./pages/home/HomePage'));
const DeckDetailPage = lazy(() => import('./pages/deck-detail/DeckDetailPage'));
const CreateDeckPage = lazy(() => import('./pages/create-deck/CreateDeckPage'));
const StudyPage = lazy(() => import('./pages/study/StudyPage'));
const TestPage = lazy(() => import('./pages/test/TestPage'));
const TypingShooterPage = lazy(() => import('./pages/minigame/TypingShooterPage'));
const ZenBuilderPage = lazy(() => import('./pages/zen/ZenBuilderPage'));
const WrittenPracticePage = lazy(() => import('./pages/written/WrittenPracticePage'));

export default function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Main App Routes wrapped in DefaultLayout */}
          <Route element={<DefaultLayout />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.DECK_DETAIL} element={<DeckDetailPage />} />
            <Route path={ROUTES.CREATE_DECK} element={<CreateDeckPage />} />
          </Route>

          {/* Immersive Learning Modes wrapped in AuthLayout / FocusLayout */}
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.STUDY} element={<StudyPage />} />
            <Route path={ROUTES.TEST} element={<TestPage />} />
            <Route path={ROUTES.MINIGAME} element={<TypingShooterPage />} />
            <Route path={ROUTES.ZEN} element={<ZenBuilderPage />} />
            <Route path={ROUTES.WRITTEN} element={<WrittenPracticePage />} />
          </Route>

          {/* 404 Fallback Route */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
