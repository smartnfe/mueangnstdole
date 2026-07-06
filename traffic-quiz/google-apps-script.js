/**
 * Google Apps Script — Backend สำหรับกิจกรรม "ฉีดวัคซีนจราจร"
 * 
 * วิธีใช้:
 * 1. เปิด Google Sheets: https://docs.google.com/spreadsheets/d/1oz3xibksS8R36g9Ss-6hxI7w8vf3ynQo3Vbxw9xenPU/edit
 * 2. ไปที่ Extensions → Apps Script
 * 3. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดนี้ลงไป
 * 4. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy URL ที่ได้ ไปวางใน src/config.js (APPS_SCRIPT_URL)
 */

const SHEET_NAME = 'Results';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp',
      'ชื่อ-นามสกุล',
      'ศกร.ตำบล',
      'คะแนน',
      'คะแนนเต็ม',
      'เวลาที่ใช้ (วินาที)',
      'คำตอบแต่ละข้อ (JSON)'
    ]);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#2563EB');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    
    switch (action) {
      case 'getLeaderboard':
        result = getLeaderboard();
        break;
      case 'getStats':
        result = getStats();
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'submitResult':
        return handleSubmitResult(e.parameter);
      case 'resetData':
        return handleResetData();
      default:
        return ContentService.createTextOutput('Error: Unknown action');
    }
    
  } catch (error) {
    return ContentService.createTextOutput('Error: ' + error.message);
  }
}

function handleSubmitResult(params) {
  const sheet = getOrCreateSheet();
  
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const name = params.name || '';
  const organization = params.organization || '';
  const score = parseInt(params.score) || 0;
  const totalQuestions = parseInt(params.totalQuestions) || 30;
  const timeUsed = parseInt(params.timeUsed) || 0;
  const answers = params.answers || '[]';
  
  sheet.appendRow([
    timestamp,
    name,
    organization,
    score,
    totalQuestions,
    timeUsed,
    answers
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    message: 'Result saved successfully' 
  })).setMimeType(ContentService.MimeType.JSON);
}

function getLeaderboard() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { players: [] };
  }
  
  const players = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1]) { // Has name
      let answersDetail = [];
      try {
        answersDetail = JSON.parse(row[6] || '[]');
      } catch (e) {
        answersDetail = [];
      }
      
      players.push({
        timestamp: row[0] ? row[0].toString() : '',
        name: row[1].toString(),
        organization: row[2].toString(),
        score: Number(row[3]) || 0,
        totalQuestions: Number(row[4]) || 30,
        timeUsed: Number(row[5]) || 0,
        answersDetail: answersDetail
      });
    }
  }
  
  // Sort by score (desc), then by time (asc)
  players.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeUsed - b.timeUsed;
  });
  
  return { players: players };
}

function getStats() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { stats: [], totalParticipants: 0, averageScore: 0 };
  }
  
  const allAnswers = [];
  let totalScore = 0;
  let participantCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1]) {
      participantCount++;
      totalScore += Number(row[3]) || 0;
      
      try {
        const answers = JSON.parse(row[6] || '[]');
        allAnswers.push(answers);
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
  
  // Calculate per-question stats
  const questionStats = [];
  for (let qId = 1; qId <= 30; qId++) {
    let correct = 0;
    let answered = 0;
    
    allAnswers.forEach(answers => {
      const answer = answers.find(a => a.questionId === qId);
      if (answer && answer.userAnswer >= 0) {
        answered++;
        if (answer.isCorrect) correct++;
      }
    });
    
    questionStats.push({
      questionId: qId,
      correctCount: correct,
      answeredCount: answered,
      correctPercentage: answered > 0 ? Math.round((correct / answered) * 100) : 0
    });
  }
  
  return {
    stats: questionStats,
    totalParticipants: participantCount,
    averageScore: participantCount > 0 ? (totalScore / participantCount).toFixed(1) : 0
  };
}

function handleResetData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    message: 'Data reset successfully' 
  })).setMimeType(ContentService.MimeType.JSON);
}
