import { getAppsScriptUrl } from '../config';

/**
 * ตรวจสอบการเชื่อมต่อกับ Google Sheets
 */
export async function checkConnection() {
  const url = getAppsScriptUrl();
  if (!url) {
    return { connected: false, message: 'ยังไม่ได้ตั้งค่า URL' };
  }

  try {
    const response = await fetch(`${url}?action=getLeaderboard`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    
    if (data.error) {
      return { connected: false, message: data.error };
    }
    
    return {
      connected: true,
      message: 'เชื่อมต่อสำเร็จ',
      playerCount: data.players ? data.players.length : 0,
    };
  } catch (error) {
    return {
      connected: false,
      message: error.name === 'TimeoutError' ? 'หมดเวลาเชื่อมต่อ' : error.message,
    };
  }
}

/**
 * ส่งผลสอบไปบันทึกยัง Google Sheets ผ่าน Apps Script
 */
export async function submitResult({ name, organization, score, totalQuestions, timeUsed, answers }) {
  const url = getAppsScriptUrl();
  if (!url) {
    console.warn('Apps Script URL not configured. Saving locally only.');
    return { success: true, local: true };
  }

  try {
    const params = new URLSearchParams({
      action: 'submitResult',
      name,
      organization,
      score: score.toString(),
      totalQuestions: totalQuestions.toString(),
      timeUsed: timeUsed.toString(),
      answers: JSON.stringify(answers),
    });

    const response = await fetch(url, {
      method: 'POST',
      body: params,
    });

    const text = await response.text();
    
    try {
      return JSON.parse(text);
    } catch {
      return { success: text.includes('Success') };
    }
  } catch (error) {
    console.error('Error submitting result:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ดึงข้อมูล Leaderboard จาก Google Sheets
 */
export async function fetchLeaderboard() {
  const url = getAppsScriptUrl();
  if (!url) {
    console.warn('Apps Script URL not configured.');
    return [];
  }

  try {
    const response = await fetch(`${url}?action=getLeaderboard`);
    const data = await response.json();
    return data.players || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * ดึงสถิติการตอบแต่ละข้อจาก Google Sheets
 */
export async function fetchStats() {
  const url = getAppsScriptUrl();
  if (!url) {
    console.warn('Apps Script URL not configured.');
    return { stats: [], totalParticipants: 0, averageScore: 0 };
  }

  try {
    const response = await fetch(`${url}?action=getStats`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { stats: [], totalParticipants: 0, averageScore: 0 };
  }
}

/**
 * ล้างข้อมูลทั้งหมดใน Sheet
 */
export async function resetAllData() {
  const url = getAppsScriptUrl();
  if (!url) {
    console.warn('Apps Script URL not configured.');
    return { success: false };
  }

  try {
    const params = new URLSearchParams({ action: 'resetData' });
    const response = await fetch(url, {
      method: 'POST',
      body: params,
    });

    const text = await response.text();
    return { success: text.includes('Success') || text.includes('success') };
  } catch (error) {
    console.error('Error resetting data:', error);
    return { success: false, error: error.message };
  }
}
