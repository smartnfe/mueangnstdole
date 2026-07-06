export default function Leaderboard({ players }) {
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.timeUsed || 0) - (b.timeUsed || 0);
  });

  const medals = ['🥇', '🥈', '🥉'];
  const medalBg = [
    'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200',
    'bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200',
    'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200',
  ];

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-bold text-gray-400 mb-2">ยังไม่มีผู้เข้าร่วม</h3>
        <p className="text-sm text-gray-400">รอผู้เข้ารับการอบรมส่งคำตอบ...</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-blue-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          กำลังรอข้อมูล
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Table Header */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="col-span-1 text-center">อันดับ</div>
        <div className="col-span-4">ชื่อ-นามสกุล</div>
        <div className="col-span-3">ศกร.ตำบล</div>
        <div className="col-span-2 text-center">คะแนน</div>
        <div className="col-span-2 text-center">เวลา</div>
      </div>

      {/* Players List */}
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const formatTimeShort = (seconds) => {
            if (!seconds) return '-';
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
          };

          return (
            <div
              key={`${player.name}-${index}`}
              className={`rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-md
                ${isTop3 ? medalBg[index] : 'bg-white border-gray-100 hover:border-gray-200'}
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Mobile Layout */}
              <div className="sm:hidden flex items-center gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                  ${isTop3 
                    ? 'bg-white shadow-sm text-2xl' 
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                  {isTop3 ? medals[index] : rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{player.name}</p>
                  <p className="text-xs text-gray-500 truncate">{player.organization || '-'}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${isTop3 ? 'text-blue-600' : 'text-gray-700'}`}>
                    {player.score}<span className="text-xs text-gray-400">/{player.totalQuestions || 30}</span>
                  </p>
                  <p className="text-xs text-gray-400">{formatTimeShort(player.timeUsed)}</p>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-center">
                  {isTop3 ? (
                    <span className="text-2xl">{medals[index]}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-400">{rank}</span>
                  )}
                </div>
                <div className="col-span-4">
                  <p className={`font-semibold truncate ${isTop3 ? 'text-gray-800 text-base' : 'text-gray-700'}`}>
                    {player.name}
                  </p>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-gray-500 truncate">{player.organization || '-'}</p>
                </div>
                <div className="col-span-2 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold
                    ${isTop3 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                    {player.score}/{player.totalQuestions || 30}
                  </span>
                </div>
                <div className="col-span-2 text-center text-sm text-gray-500 font-mono">
                  {formatTimeShort(player.timeUsed)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
