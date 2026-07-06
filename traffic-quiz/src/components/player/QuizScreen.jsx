import { useState, useEffect, useRef, useCallback } from 'react';
import questions from '../../data/questions';
import QuestionCard from './QuestionCard';
import QuizProgress from './QuizProgress';
import { formatTime } from '../../utils/helpers';
import { TOTAL_QUESTIONS } from '../../config';

export default function QuizScreen({ playerInfo, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === TOTAL_QUESTIONS - 1;
  const hasAnswered = answers[currentQuestion.id] !== undefined;

  const handleSelectAnswer = useCallback((choiceIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: choiceIndex,
    }));
  }, [currentQuestion.id]);

  const handleNext = () => {
    if (isLastQuestion) {
      setShowConfirm(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    clearInterval(timerRef.current);

    // Calculate score
    let score = 0;
    const answersDetail = [];

    questions.forEach((q) => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) score++;
      answersDetail.push({
        questionId: q.id,
        userAnswer: userAnswer !== undefined ? userAnswer : -1,
        correctAnswer: q.correctAnswer,
        isCorrect,
      });
    });

    onComplete({
      ...playerInfo,
      score,
      totalQuestions: TOTAL_QUESTIONS,
      timeUsed: elapsedTime,
      answers: answersDetail,
    });
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = TOTAL_QUESTIONS - answeredCount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚦</span>
              <span className="text-sm font-semibold text-gray-700">ฉีดวัคซีนจราจร</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-blue-600 font-mono font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>
          <QuizProgress current={currentIndex + 1} total={TOTAL_QUESTIONS} />
        </div>
      </div>

      {/* Question Area */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.id]}
          onSelectAnswer={handleSelectAnswer}
          questionNumber={currentIndex + 1}
          totalQuestions={TOTAL_QUESTIONS}
        />

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 mt-8">
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="btn-outline flex-1 sm:flex-none"
            >
              <span className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                ข้อก่อนหน้า
              </span>
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!hasAnswered}
            className={`flex-1 sm:flex-none sm:ml-auto text-center py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform
              ${!hasAnswered
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isLastQuestion
                  ? 'btn-success'
                  : 'btn-primary'
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              {isLastQuestion ? (
                <>
                  ส่งคำตอบ
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  ข้อถัดไป
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </div>

        {/* Question Navigator (dots) */}
        <div className="mt-8 p-4 bg-white rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 mb-3 font-medium">ทำแล้ว {answeredCount}/{TOTAL_QUESTIONS} ข้อ</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, index) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = index === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200
                    ${isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-110'
                      : isAnswered
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ยืนยันส่งคำตอบ?</h3>
              <p className="text-sm text-gray-500">
                คุณตอบแล้ว <span className="font-semibold text-emerald-600">{answeredCount}</span> ข้อ
                {unansweredCount > 0 && (
                  <span className="text-orange-500"> (ยังไม่ตอบ {unansweredCount} ข้อ)</span>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                เวลาที่ใช้: <span className="font-semibold text-blue-600">{formatTime(elapsedTime)}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-outline flex-1"
                disabled={isSubmitting}
              >
                กลับแก้ไข
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-success flex-1"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังส่ง...
                  </span>
                ) : (
                  'ยืนยันส่ง'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
