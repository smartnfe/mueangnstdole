/**
 * ค่าตั้งต้นของหน้าเว็บ
 * apiUrl: ใส่ URL ของ Apps Script Web App ที่ลงท้ายด้วย /exec ไว้ที่นี่
 *         ผู้ใช้ทั่วไปจึงไม่ต้องกรอกเอง — เปิดหน้าก็เจอหน้าเข้าสู่ระบบทันที
 *         ลำดับความสำคัญ: localStorage (rpt_api_url) > ค่าในไฟล์นี้
 *         ถ้าต้องเปลี่ยนภายหลัง ให้แก้ไฟล์นี้แล้ว push ใหม่
 */
window.REPORT_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbz1C_jP0yFXd9L41WnPMHrFwwwC4xstxo2g-Yj-Ibs_cMeGEUErIgWgRFPnvTLLF2g2Qw/exec',
  appTitle: 'ระบบรายงานผลการปฏิบัติงาน',
  orgName: 'ศูนย์ส่งเสริมการเรียนรู้ระดับอำเภอเมืองนครศรีธรรมราช'
};
