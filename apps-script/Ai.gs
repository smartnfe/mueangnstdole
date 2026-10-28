/**
 * เขียนผลการปฏิบัติงานด้วย AI (Gemini)
 * - API key เก็บใน Script Properties (ห้ามฝังในโค้ด/ไฟล์ที่ commit)
 * - จำกัดจำนวนครั้ง/ชั่วโมง/คน
 * - cache ผลลัพธ์ซ้ำ 6 ชั่วโมง
 */

const Ai = {

  generate: function (p, token) {
    const u = requireUser_(token);

    const plan = str_(p.plan, 300);
    const location = str_(p.location, 200);
    const target = str_(p.target, 300);
    const date = toIsoDate_(p.date) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    if (!plan) throw apiError_('VALIDATION', 'กรุณากรอกกิจกรรม/แผนงานก่อนให้ AI ช่วยเขียน');

    const cfg = getConfig_();
    const limit = Number(cfg.MAX_AI_PER_HOUR || 20);
    const cache = CacheService.getScriptCache();
    const hourKey = 'aiu_' + u.username + '_' +
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHH');
    const used = Number(cache.get(hourKey) || 0);
    if (used >= limit) {
      throw apiError_('RATE_LIMITED', 'ใช้ AI ครบ ' + limit + ' ครั้ง/ชั่วโมงแล้ว กรุณาลองใหม่ภายหลัง');
    }

    const model = cfg.GEMINI_MODEL || 'gemini-flash-latest';
    const sig = hashStr_([plan, location, target, date, model, cfg.PROMPT_TEMPLATE].join('|')).slice(0, 40);
    const cacheKey = 'aig_' + sig;
    const hit = cache.get(cacheKey);
    if (hit) {
      return { text: hit, model: model, cached: true, latencyMs: 0 };
    }

    const apiKey = getProp_('GEMINI_API_KEY');
    if (!apiKey) {
      throw apiError_('AI_UNAVAILABLE', 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Project Settings → Script Properties');
    }

    const prompt = renderTemplate_(cfg.PROMPT_TEMPLATE, {
      org: cfg.ORG_NAME || '',
      orgShort: cfg.ORG_SHORT || '',
      date: date,
      plan: plan,
      location: location || '-',
      target: target || '-'
    });

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

    const t0 = Date.now();
    let res;
    try {
      res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, topP: 0.95, maxOutputTokens: 512 }
        }),
        muteHttpExceptions: true
      });
    } catch (e) {
      throw apiError_('AI_UNAVAILABLE', 'เชื่อมต่อ AI ไม่ได้: ' + e.message);
    }

    const code = res.getResponseCode();
    if (code === 429) {
      throw apiError_('RATE_LIMITED', 'AI ถูกจำกัดการใช้งานชั่วคราว กรุณาลองใหม่ในอีกสักครู่');
    }
    if (code >= 400) {
      const body = res.getContentText().slice(0, 200);
      logEvent_(u.username, 'ai.error', 'gemini', 'HTTP ' + code + ' ' + body);
      throw apiError_('AI_UNAVAILABLE', 'AI ตอบกลับผิดพลาด (HTTP ' + code + ')');
    }

    let text = '';
    try {
      const j = JSON.parse(res.getContentText());
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      text = parts.map(function (x) { return x.text || ''; }).join('').trim();
    } catch (e) {
      throw apiError_('AI_UNAVAILABLE', 'อ่านคำตอบจาก AI ไม่ได้');
    }
    if (!text) throw apiError_('AI_UNAVAILABLE', 'AI ไม่ได้ส่งข้อความกลับมา');

    cache.put(cacheKey, text, 21600);
    cache.put(hourKey, String(used + 1), 3600);

    logEvent_(u.username, 'ai.generate', 'gemini', 'model=' + model + ' len=' + text.length);
    return { text: text, model: model, cached: false, latencyMs: Date.now() - t0 };
  }
};

function renderTemplate_(tpl, vars) {
  return String(tpl || '').replace(/\{\{(\w+)\}\}/g, function (m, key) {
    return vars[key] === undefined ? '' : String(vars[key]);
  });
}
