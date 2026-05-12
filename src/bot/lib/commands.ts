export const COMMAND = {
  CREATE: '/新增',
  LIST: '/任務',
  TODAY: '/今天',
  EDIT: '/編輯',
  DELETE: '/刪除',
  CANCEL: '/取消',
  HELP: '/指令',
  HELP_EN: '/help',
} as const;

export type Command = (typeof COMMAND)[keyof typeof COMMAND];
