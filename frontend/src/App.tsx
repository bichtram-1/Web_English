import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Loading from './components/shared/Loading';
import DefaultLayout from './components/layout/DefaultLayout';
import AuthLayout from './components/layout/AuthLayout';
import PageNotFound from './components/general/PageNotFound';
import { AuthProvider } from './contexts/AuthContext';
import { WallpaperProvider } from './contexts/WallpaperContext';
import { ROUTES } from './constants/routers';

// Lazy loading pages following DATN enterprise architecture pattern
const HomePage = lazy(() => import('./pages/home/HomePage'));
const DeckDetailPage = lazy(() => import('./pages/deck-detail/DeckDetailPage'));
const CreateDeckPage = lazy(() => import('./pages/create-deck/CreateDeckPage'));
const CollectionsPage = lazy(() => import('./pages/collections/CollectionsPage'));
const CollectionDetailPage = lazy(() => import('./pages/collections/CollectionDetailPage'));
const StudyPage = lazy(() => import('./pages/study/StudyPage'));
const TestPage = lazy(() => import('./pages/test/TestPage'));
const TypingShooterPage = lazy(() => import('./pages/minigame/TypingShooterPage'));
const ZenBuilderPage = lazy(() => import('./pages/zen/ZenBuilderPage'));
const WrittenPracticePage = lazy(() => import('./pages/written/WrittenPracticePage'));
const MemoryMatchPage = lazy(() => import('./pages/match/MemoryMatchPage'));
const TreasureHuntPage = lazy(() => import('./pages/treasure/TreasureHuntPage'));
const ArcadeGamesPage = lazy(() => import('./pages/games/ArcadeGamesPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const StatsPage = lazy(() => import('./pages/stats/StatsPage'));
const TextTranslateExtractPage = lazy(() => import('./pages/tools/TextTranslateExtractPage'));

export default function App() {
  return (
    <AuthProvider>
      <WallpaperProvider>
        <Router>
          <Suspense fallback={<Loading />}>
          <Routes>
            {/* Auth Routes */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

            {/* Main Application with Default Layout */}
            <Route element={<DefaultLayout />}>
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.DECK_DETAIL} element={<DeckDetailPage />} />
              <Route path={ROUTES.CREATE_DECK} element={<CreateDeckPage />} />
              <Route path={ROUTES.EDIT_DECK} element={<CreateDeckPage />} />
              <Route path={ROUTES.COLLECTIONS} element={<CollectionsPage />} />
              <Route path={ROUTES.COLLECTION_DETAIL} element={<CollectionDetailPage />} />
              <Route path={ROUTES.GAMES} element={<ArcadeGamesPage />} />
              <Route path={ROUTES.STATS} element={<StatsPage />} />
              <Route path={ROUTES.TRANSLATE} element={<TextTranslateExtractPage />} />
              <Route path={ROUTES.TRANSLATE_EXTRACT} element={<TextTranslateExtractPage />} />
            </Route>

            {/* Immersive Learning Modes */}
            <Route element={<AuthLayout />}>
              <Route path={ROUTES.STUDY} element={<StudyPage />} />
              <Route path={ROUTES.COLLECTION_STUDY} element={<StudyPage />} />
              <Route path={ROUTES.COLLECTION_WRITTEN} element={<WrittenPracticePage />} />
              <Route path={ROUTES.TEST} element={<TestPage />} />
              <Route path={ROUTES.SHOOTER} element={<TypingShooterPage />} />
              <Route path={ROUTES.MINIGAME} element={<TypingShooterPage />} />
              <Route path={ROUTES.MATCH} element={<MemoryMatchPage />} />
              <Route path={ROUTES.TREASURE} element={<TreasureHuntPage />} />
              <Route path={ROUTES.GLOBAL_TREASURE} element={<TreasureHuntPage />} />
              <Route path={ROUTES.GLOBAL_MATCH} element={<MemoryMatchPage />} />
              <Route path={ROUTES.GLOBAL_SHOOTER} element={<TypingShooterPage />} />
              <Route path={ROUTES.GLOBAL_ZEN} element={<ZenBuilderPage />} />
              <Route path={ROUTES.ZEN} element={<ZenBuilderPage />} />
              <Route path={ROUTES.WRITTEN} element={<WrittenPracticePage />} />
            </Route>

            {/* 404 Fallback Route */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </Router>
      </WallpaperProvider>
    </AuthProvider>
  );
}
