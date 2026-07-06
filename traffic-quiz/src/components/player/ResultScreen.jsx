import { useEffect, useState } from 'react';
import questions from '../../data/questions';
import { formatTimeThai, calculatePercentage, getGrade, createConfetti } from '../../utils/helpers';

export default function ResultScreen({ result, onBackHome }) {
  const [showDetails, setShowDetails] = useState(false);
  const { score, totalQuestions, timeUsed, answers } = result;
  const percentage = calculatePercentage(score, totalQuestions);
  const grade = getGrade(score, totalQuestions);

  useEffect(() => {
    if (percentage >= 80) {
      // Show confetti for high scores
      setTimeout(() => createConfetti(), 300);
    }
  }, [percentage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4">
      <div className="max-w-lg mx-auto pt-8 animate-fade-in">
        {/* Score Card */}
        <div className="card-elevated p-8 text-center mb-6">
          {/* Grade Emoji */}
          <div className="text-6xl mb-4 animate-bounce-in">{grade.emoji}</div>
          
          {/* Score */}
          <div className="mb-4">
            <div className={`text-5xl sm:text-6xl font-extrabold ${grade.color} animate-count-up`}>
              {score}
              <span className="text-2xl sm:text-3xl text-gray-400 font-bold">/{totalQuestions}</span>
            </div>
            <p className={`text-xl font-bold mt-2 ${grade.color}`}>{grade.label}</p>
          </div>

          {/* Score Ring */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64" cy="64" r="56"
                stroke="#F3F4F6" strokeWidth="8" fill="none"
              />
              <circle
                cx="64" cy="64" r="56"
                stroke={percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444'}
                strokeWidth="8" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 3.52} 352`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-extrabold text-gray-800">{percentage}%</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-xs text-blue-600 font-medium mb-1">⏱️ เวลา</div>
              <div className="text-sm font-bold text-blue-800">{formatTimeThai(timeUsed)}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-xs text-emerald-600 font-medium mb-1">✅ ถูก</div>
              <div className="text-sm font-bold text-emerald-800">{score} ข้อ</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-xs text-red-600 font-medium mb-1">❌ ผิด</div>
              <div className="text-sm font-bold text-red-800">{totalQuestions - score} ข้อ</div>
            </div>
          </div>

          {/* Player Info */}
          <div className="text-sm text-gray-500 border-t border-gray-100 pt-4 mt-4">
            <p><span className="font-medium text-gray-700">{result.name}</span></p>
            <p>{result.organization}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button onClick={onBackHome} className="btn-outline flex-1">
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" />
              </svg>
              กลับหน้าหลัก
            </span>
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-primary flex-1"
          >
            <span className="flex items-center justify-center gap-2">
              {showDetails ? 'ซ่อนเฉลย' : 'ดูเฉลย'}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        </div>

        {/* Answer Details */}
        {showDetails && (
          <div className="space-y-3 animate-slide-up pb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📝 เฉลยคำตอบ</h3>
            {questions.map((q, index) => {
              const answer = answers.find(a => a.questionId === q.id);
              const isCorrect = answer?.isCorrect;
              const userAnswerIndex = answer?.userAnswer;
              const choiceLabels = ['ก', 'ข', 'ค', 'ง'];

              return (
                <div
                  key={q.id}
                  className={`card p-4 border-l-4 ${
                    isCorrect ? 'border-l-emerald-400' : 'border-l-red-400'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                      ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        ข้อ {index + 1}: {q.question}
                      </p>
                      
                      {!isCorrect && userAnswerIndex >= 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          คุณตอบ: {choiceLabels[userAnswerIndex]}. {q.choices[userAnswerIndex]?.replace(/^[ก-ง]\.\s*/, '')}
                        </p>
                      )}
                      {userAnswerIndex === -1 && (
                        <p className="text-xs text-gray-400 mt-1">ไม่ได้ตอบ</p>
                      )}
                      
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        ✅ เฉลย: {choiceLabels[q.correctAnswer]}. {q.choices[q.correctAnswer]?.replace(/^[ก-ง]\.\s*/, '')}
                      </p>
                      
                      {q.explanation && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
