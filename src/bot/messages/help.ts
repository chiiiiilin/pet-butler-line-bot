import { messagingApi } from '@line/bot-sdk';
import { COMMAND } from '../lib/commands';

export function commandsHelp(): messagingApi.TextMessage {
  return {
    type: 'text',
    text:
      '📋 指令清單\n\n' +
      `${COMMAND.CREATE} — 建立新任務\n` +
      `${COMMAND.LIST} — 看全部任務\n` +
      `${COMMAND.TODAY} — 看今天 + 逾期任務\n` +
      `${COMMAND.EDIT} — 編輯任務\n` +
      `${COMMAND.DELETE} — 刪除任務\n` +
      `${COMMAND.CANCEL} — 退出任何進行中流程\n` +
      `${COMMAND.HELP} — 顯示這個清單`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: { type: 'message', label: '新增', text: COMMAND.CREATE },
        },
        {
          type: 'action',
          action: { type: 'message', label: '任務', text: COMMAND.LIST },
        },
        {
          type: 'action',
          action: { type: 'message', label: '今天', text: COMMAND.TODAY },
        },
        {
          type: 'action',
          action: { type: 'message', label: '編輯', text: COMMAND.EDIT },
        },
        {
          type: 'action',
          action: { type: 'message', label: '刪除', text: COMMAND.DELETE },
        },
      ],
    },
  };
}
