/**
 * สรุปภาพรวมรายเดือน (admin)
 */

const Stats = {

  overview: function (p, token) {
    requireAdmin_(token);

    const now = new Date();
    const year = Number(p.year) || Number(Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy'));
    const month = Number(p.month) || Number(Utilities.formatDate(now, Session.getScriptTimeZone(), 'MM'));
    const prefix = year + '-' + ('0' + month).slice(-2);

    const users = readUsers_();
    const nameMap = {};
    users.forEach(function (u) { nameMap[u.username] = u.name || u.username; });

    const rows = readLogs_().filter(function (r) {
      return !r.deleted && r.workDate.indexOf(prefix) === 0;
    });

    const byUserMap = {};
    const byDayMap = {};
    rows.forEach(function (r) {
      byUserMap[r.username] = (byUserMap[r.username] || 0) + 1;
      byDayMap[r.workDate] = (byDayMap[r.workDate] || 0) + 1;
    });

    const byUser = Object.keys(byUserMap).map(function (k) {
      return { username: k, name: nameMap[k] || k, count: byUserMap[k] };
    }).sort(function (a, b) { return b.count - a.count; });

    const members = users.filter(function (u) { return u.active; }).length;
    const byDay = Object.keys(byDayMap).sort().map(function (k) {
      return { date: k, count: byDayMap[k] };
    });

    return {
      year: year,
      month: month,
      total: rows.length,
      reportedUsers: byUser.length,
      activeMembers: members,
      missing: Math.max(members - byUser.length, 0),
      byUser: byUser,
      byDay: byDay
    };
  }
};
