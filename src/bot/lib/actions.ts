export const ACTION = {
  COMPLETE: 'complete',
  SNOOZE: 'snooze',
  DELETE: 'delete',
  EDIT_NAME: 'editName',
  EDIT_FREQ: 'editFreq',
  EDIT_TIME: 'editTime',
  EDIT_DATE: 'editDate',
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
  FREQ: 'freq',
} as const;

export type PostbackAction = (typeof ACTION)[keyof typeof ACTION];
