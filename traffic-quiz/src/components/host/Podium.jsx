import { useEffect, useState } from 'react';

export default function Podium({ players }) {
  const [animated, setAnimated] = useState(false);

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.timeUsed || 0) - (b.timeUsed || 0);
  });

  const top3 = sortedPlayers.slice(0, 3);
  const first = top3[0] || null;
  const second = top3[1] || null;
  const third = top3[2] || null;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatTimeShort = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-bold text-gray-400 mb-2">ยังไม่มีผู้ชนะ</h3>
        <p className="text-sm text-gray-400">รอผู้เข้ารับการอบรมส่งคำตอบ...</p>
      </div>
    );
  }

  const PodiumBlock = ({ player, rank, height, delay, medal, gradient }) => {
    if (!player) return <div className="w-full" />;

    return (
      <div className="flex flex-col items-center justify-end w-full">
        {/* Player Info */}
        <div
          className={`text-center mb-4 transition-all duration-700 ${
            animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: `${delay + 400}ms` }}
        >
          <div className="text-4xl sm:text-5xl mb-2">{medal}</div>
          <p className="text-base sm:text-lg font-bold text-gray-800 mb-0.5 max-w-[160px] truncate mx-auto">
            {player.name}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 max-w-[140px] truncate mx-auto">
            {player.organization || '-'}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full shadow-sm border border-gray-100">
            <span className="text-sm sm:text-base font-extrabold text-blue-600">{player.score}</span>
            <span className="text-xs text-gray-400">/{player.totalQuestions || 30}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">⏱️ {formatTimeShort(player.timeUsed)}</p>
        </div>

        {/* Podium Stand */}
        <div
          className={`w-full rounded-t-2xl flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-lg transition-all duration-1000 ease-out ${gradient} ${
            animated ? '' : 'scale-y-0'
          }`}
          style={{
            height: animated ? height : '0px',
            transformOrigin: 'bottom',
            transitionDelay: `${delay}ms`,
          }}
        >
          <span className={`transition-opacity duration-500 ${animated ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: `${delay + 600}ms` }}>
            {rank}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Title */}
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-800 mb-2">
          🏆 ผู้ชนะเลิศ
        </h2>
        <p className="text-sm sm:text-base text-gray-500">กิจกรรมฉีดวัคซีนจราจร</p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto px-4" style={{ minHeight: '320px' }}>
        {/* 2nd Place (Left) */}
        <PodiumBlock
          player={second}
          rank={2}
          height="180px"
          delay={300}
          medal="🥈"
          gradient="bg-gradient-to-t from-slate-400 to-slate-300"
        />

        {/* 1st Place (Center) */}
        <PodiumBlock
          player={first}
          rank={1}
          height="240px"
          delay={0}
          medal="🥇"
          gradient="bg-gradient-to-t from-yellow-500 to-amber-400"
        />

        {/* 3rd Place (Right) */}
        <PodiumBlock
          player={third}
          rank={3}
          height="140px"
          delay={600}
          medal="🥉"
          gradient="bg-gradient-to-t from-orange-500 to-orange-400"
        />
      </div>

      {/* Honorable Mentions */}
      {sortedPlayers.length > 3 && (
        <div className="mt-10 max-w-lg mx-auto px-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 text-center uppercase tracking-wider">
            อันดับถัดไป
          </h3>
          <div className="space-y-2">
            {sortedPlayers.slice(3, 10).map((player, index) => (
              <div key={`${player.name}-${index}`} className="flex items-center gap-3 card p-3">
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  {index + 4}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{player.name}</p>
                  <p className="text-xs text-gray-400 truncate">{player.organization || '-'}</p>
                </div>
                <span className="text-sm font-bold text-gray-600">
                  {player.score}<span className="text-xs text-gray-400">/{player.totalQuestions || 30}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
