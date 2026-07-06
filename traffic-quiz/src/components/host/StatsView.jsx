import questions from '../../data/questions';

export default function StatsView({ players }) {
  // Calculate stats for each question
  const questionStats = questions.map((q) => {
    let correctCount = 0;
    let answeredCount = 0;

    players.forEach((player) => {
      if (player.answersDetail) {
        const answer = player.answersDetail.find(a => a.questionId === q.id);
        if (answer && answer.userAnswer >= 0) {
          answeredCount++;
          if (answer.isCorrect) correctCount++;
        }
      }
    });

    const correctPercentage = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    return {
      id: q.id,
      question: q.question,
      correctCount,
      answeredCount,
      correctPercentage,
    };
  });

  // Calculate overall stats
  const totalParticipants = players.length;
  const averageScore = totalParticipants > 0
    ? (players.reduce((sum, p) => sum + (p.score || 0), 0) / totalParticipants).toFixed(1)
    : 0;
  const averagePercentage = totalParticipants > 0
    ? Math.round((averageScore / 30) * 100)
    : 0;

  // Find hardest and easiest questions
  const answeredStats = questionStats.filter(s => s.answeredCount > 0);
  const hardestQuestion = answeredStats.length > 0
    ? answeredStats.reduce((min, s) => s.correctPercentage < min.correctPercentage ? s : min)
    : null;
  const easiestQuestion = answeredStats.length > 0
    ? answeredStats.reduce((max, s) => s.correctPercentage > max.correctPercentage ? s : max)
    : null;

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-400 mb-2">ยังไม่มีข้อมูล</h3>
        <p className="text-sm text-gray-400">รอผู้เข้ารับการอบรมส่งคำตอบ...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">👥 ผู้เข้าร่วม</p>
          <p className="text-3xl font-extrabold text-gray-800">{totalParticipants}</p>
          <p className="text-xs text-gray-400">คน</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">📊 คะแนนเฉลี่ย</p>
          <p className="text-3xl font-extrabold text-blue-600">{averageScore}</p>
          <p className="text-xs text-gray-400">/30 ({averagePercentage}%)</p>
        </div>
        {easiestQuestion && (
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">✅ ง่ายที่สุด</p>
            <p className="text-2xl font-extrabold text-emerald-600">ข้อ {easiestQuestion.id}</p>
            <p className="text-xs text-emerald-500">ถูก {easiestQuestion.correctPercentage}%</p>
          </div>
        )}
        {hardestQuestion && (
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">🔴 ยากที่สุด</p>
            <p className="text-2xl font-extrabold text-red-600">ข้อ {hardestQuestion.id}</p>
            <p className="text-xs text-red-500">ถูก {hardestQuestion.correctPercentage}%</p>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📈 เปอร์เซ็นต์ตอบถูกแต่ละข้อ</h3>
        <div className="space-y-2">
          {questionStats.map((stat) => {
            const barColor =
              stat.correctPercentage >= 80 ? 'bg-emerald-500' :
              stat.correctPercentage >= 60 ? 'bg-blue-500' :
              stat.correctPercentage >= 40 ? 'bg-yellow-500' :
              'bg-red-500';

            const bgColor =
              stat.correctPercentage >= 80 ? 'bg-emerald-50' :
              stat.correctPercentage >= 60 ? 'bg-blue-50' :
              stat.correctPercentage >= 40 ? 'bg-yellow-50' :
              'bg-red-50';

            return (
              <div key={stat.id} className={`flex items-center gap-3 p-2 rounded-lg ${stat.correctPercentage < 40 ? bgColor : ''} group`}>
                <span className="flex-shrink-0 w-8 text-xs font-bold text-gray-500 text-right">
                  {stat.id}.
                </span>
                <div className="flex-1">
                  <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full ${barColor} rounded-full progress-bar-fill flex items-center`}
                      style={{ width: `${Math.max(stat.correctPercentage, 2)}%` }}
                    >
                    </div>
                    <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold text-gray-600">
                      {stat.correctPercentage > 0 ? `${stat.correctPercentage}%` : '-'}
                    </span>
                  </div>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-400 w-16 text-right">
                  {stat.correctCount}/{stat.answeredCount}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weakest Topics */}
      {answeredStats.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ จุดอ่อนวินัยจราจร (ข้อที่ตอบถูกน้อยที่สุด)</h3>
          <div className="space-y-3">
            {[...questionStats]
              .filter(s => s.answeredCount > 0)
              .sort((a, b) => a.correctPercentage - b.correctPercentage)
              .slice(0, 5)
              .map((stat) => {
                const question = questions.find(q => q.id === stat.id);
                return (
                  <div key={stat.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <span className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {stat.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-relaxed">{question?.question}</p>
                      <p className="text-xs text-red-500 mt-1 font-semibold">ตอบถูก {stat.correctPercentage}% ({stat.correctCount}/{stat.answeredCount} คน)</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
