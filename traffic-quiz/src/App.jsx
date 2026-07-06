import { useState } from 'react';
import LandingPage from './components/LandingPage';
import PlayerForm from './components/player/PlayerForm';
import QuizScreen from './components/player/QuizScreen';
import ResultScreen from './components/player/ResultScreen';
import HostDashboard from './components/host/HostDashboard';
import { submitResult } from './utils/api';

/*
  App States:
  - landing     → Landing page (role selection)
  - playerForm  → Player registration form
  - quiz        → Quiz screen (30 questions)
  - result      → Result screen (score + review)
  - host        → Host dashboard (leaderboard, stats, podium)
*/

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [playerInfo, setPlayerInfo] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const handleSelectRole = (role) => {
    if (role === 'player') {
      setCurrentView('playerForm');
    } else {
      setCurrentView('host');
    }
  };

  const handlePlayerFormSubmit = (info) => {
    setPlayerInfo(info);
    setCurrentView('quiz');
  };

  const handleQuizComplete = async (result) => {
    setQuizResult(result);
    setCurrentView('result');

    // Submit to Google Sheets in background
    try {
      await submitResult({
        name: result.name,
        organization: result.organization,
        score: result.score,
        totalQuestions: result.totalQuestions,
        timeUsed: result.timeUsed,
        answers: result.answers,
      });
    } catch (error) {
      console.error('Failed to submit result:', error);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('landing');
    setPlayerInfo(null);
    setQuizResult(null);
  };

  return (
    <>
      {currentView === 'landing' && (
        <LandingPage onSelectRole={handleSelectRole} />
      )}

      {currentView === 'playerForm' && (
        <PlayerForm onSubmit={handlePlayerFormSubmit} />
      )}

      {currentView === 'quiz' && playerInfo && (
        <QuizScreen
          playerInfo={playerInfo}
          onComplete={handleQuizComplete}
        />
      )}

      {currentView === 'result' && quizResult && (
        <ResultScreen
          result={quizResult}
          onBackHome={handleBackToHome}
        />
      )}

      {currentView === 'host' && (
        <HostDashboard onBack={handleBackToHome} />
      )}
    </>
  );
}
