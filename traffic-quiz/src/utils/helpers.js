/**
 * แปลงเวลาจากวินาทีเป็น mm:ss
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * แปลงเวลาจากวินาทีเป็นข้อความภาษาไทย
 */
export function formatTimeThai(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} วินาที`;
  return `${mins} นาที ${secs} วินาที`;
}

/**
 * คำนวณเปอร์เซ็นต์
 */
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Export ข้อมูลเป็น CSV และดาวน์โหลด
 */
export function exportToCSV(data, filename = 'leaderboard.csv') {
  if (!data || data.length === 0) return;

  const headers = ['ลำดับ', 'ชื่อ-นามสกุล', 'ศกร.ตำบล', 'คะแนน', 'คะแนนเต็ม', 'เวลาที่ใช้ (วินาที)', 'Timestamp'];
  
  const csvContent = [
    // BOM for UTF-8
    '\uFEFF',
    headers.join(','),
    ...data.map((row, index) => 
      [
        index + 1,
        `"${row.name || ''}"`,
        `"${row.organization || ''}"`,
        row.score || 0,
        row.totalQuestions || 30,
        row.timeUsed || 0,
        `"${row.timestamp || ''}"`,
      ].join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * สร้าง Confetti particles
 */
export function createConfetti(container) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const pieces = 50;
  
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    piece.style.width = (Math.random() * 8 + 5) + 'px';
    piece.style.height = (Math.random() * 8 + 5) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    
    if (container) {
      container.appendChild(piece);
    } else {
      document.body.appendChild(piece);
    }

    setTimeout(() => piece.remove(), 3500);
  }
}

/**
 * สร้างข้อความ Grade จากคะแนน
 */
export function getGrade(score, total) {
  const pct = (score / total) * 100;
  if (pct >= 90) return { label: 'ยอดเยี่ยม!', emoji: '🏆', color: 'text-yellow-500' };
  if (pct >= 80) return { label: 'ดีมาก!', emoji: '🌟', color: 'text-blue-500' };
  if (pct >= 70) return { label: 'ดี', emoji: '👍', color: 'text-emerald-500' };
  if (pct >= 60) return { label: 'พอใช้', emoji: '📝', color: 'text-orange-500' };
  return { label: 'ต้องปรับปรุง', emoji: '📖', color: 'text-red-500' };
}
