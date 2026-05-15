import { COMMAND } from '../lib/commands';

export const TEXT = {
  common: {
    cancelled: '🐾 已取消這次操作',
    taskNotFound: '喵？找不到這個任務耶 ᓚ₍ ^. .^₎',
    stateErrorEdit: `小貓有點搞混了\n請重新 ${COMMAND.EDIT}`,
    guideToButtons: `請點上方按鈕操作\n或輸入 ${COMMAND.CANCEL} 離開`,
    unknownCommand: '喵？小貓看不懂這個指令耶\n試試下面的指令吧🐾',
    greeting: `喵嗚 我是貓貓管家🐾 \n幫你記住重要的小事\n\n輸入 ${COMMAND.CREATE} 建立任務\n輸入 ${COMMAND.HELP} 查看全部指令🐱`,
  },

  create: {
    askName: '請輸入任務名稱 \n讓小貓幫你記下來🐾',
    askCustomDays: '幾天提醒一次呢？例如 30',
    invalidDays: '請輸入正整數，例如 30',
    incompleteData: `資料還沒填完整呢喵 \n請重新 ${COMMAND.CREATE}🐱`,
    created: (name: string, freqText: string, firstReminder: string) =>
      `🐾 任務建立完成\n名稱：${name}\n頻率：${freqText}\n首次提醒：${firstReminder}`,
  },

  list: {
    empty: `目前還沒有任務呦～\n輸入 ${COMMAND.CREATE} 建立第一個吧 🐾`,
    emptyToDelete: '🐾目前沒有任務可以刪除',
    emptyToEdit: '🐾目前沒有任務可以編輯',
  },

  today: {
    empty: '今天沒有待辦 \n小貓來去偷懶一下 🐾',
    intro: (count: number) => `🐱 今天有 ${count} 個任務`,
  },

  edit: {
    askNewName: '請輸入新的任務名稱：',
    nameUpdated: (name: string) => `🐾 已改名為「${name}」`,
    freqUpdatedDays: (days: number) => `🐾 已改成每 ${days} 天提醒一次`,
    freqUpdatedOneoff: '🐾 已改成不重複任務',
    dateUpdated: (name: string, nextReminder: string) =>
      `已更新「${name}」🐾\n下次提醒：${nextReminder}`,
  },

  task: {
    archived: '🐾一次性任務已歸檔',
    nextReminder: (date: string) => `🐾下次提醒：${date}`,
    completed: (name: string, by: string, tail: string) =>
      `🐱已完成「${name}」 （by ${by}）\n${tail}`,
    snoozed: (name: string, nextReminder: string) =>
      `🐱已延後「${name}」\n下次提醒：${nextReminder}`,
    deleted: '🐾 任務已刪除',
  },

  reminder: {
    morningIntro: (count: number) => `🐱 早安～今天有 ${count} 個任務`,
    eveningIntro: (count: number) => `🐾 晚間提醒:\n還有 ${count} 個任務沒完成`,
  },

  quota: {
    low: (remaining: number) =>
      `⚠️ 本月推播額度剩 ${remaining} 則\n用完後定時提醒將暫停至下月 1 日`,
    exceeded: '⚠️ 本月推播額度已用完\n定時提醒暫停至下月 1 日恢復',
  },

  freq: {
    oneoff: '不重複',
    everyDays: (days: number) => `每 ${days} 天`,
  },

  overdue: {
    long: (days: number) => `🐾 已逾期 ${days} 天`,
    short: (days: number) => `🐾 ${days} 天`,
  },

  labels: {
    task: '任務',
    frequency: '頻率',
    nextDue: '下次',
    lastDone: '上次完成',
    startDate: '開始',
  },

  buttons: {
    complete: '完成',
    snooze: '稍後提醒',
    delete: '刪除這個',
    deleteDisplay: '刪除任務',
    editName: '改名稱',
    editNameDisplay: '改名稱',
    editFreq: '改頻率',
    editFreqDisplay: '改頻率',
    editDate: '改日期',
    cancel: '取消',
    confirmCreate: '確認建立',
  },

  alt: {
    taskList: '任務列表',
    deleteSelection: '選擇要刪除的任務',
    editSelection: '選擇要編輯的任務',
    confirmCreate: '確認建立任務',
  },

  confirmCard: {
    title: '🐾 確認建立任務',
  },

  freqQuickReply: {
    prompt: '請選擇提醒頻率：',
    daily: '每天',
    weekly: '每週',
    monthly: '每月',
    quarterly: '每季',
    custom: '自訂天數',
    oneoff: '不重複',
  },

  startDateQuickReply: {
    prompt: '從哪一天開始提醒呢？',
    today: '今天',
    tomorrow: '明天',
    custom: '自訂日期',
  },

  help: {
    title: '🐈‍⬛ 貓貓管家指令清單🐈‍⬛ \n\n',
    body:
      `${COMMAND.CREATE} — 建立新任務\n` +
      `${COMMAND.LIST} — 查看全部任務\n` +
      `${COMMAND.TODAY} — 查看今天與逾期任務\n` +
      `${COMMAND.EDIT} — 編輯任務\n` +
      `${COMMAND.DELETE} — 刪除任務\n` +
      `${COMMAND.CANCEL} — 離開目前操作\n` +
      `${COMMAND.HELP} — 顯示這份清單`,
    qr: {
      create: '新增',
      list: '任務',
      today: '今天',
      edit: '編輯',
      delete: '刪除',
    },
  },
} as const;
