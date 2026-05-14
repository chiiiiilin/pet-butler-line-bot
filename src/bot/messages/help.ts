import { messagingApi } from '@line/bot-sdk';
import { COMMAND } from '../lib/commands';
import { TEXT } from './text';

export function commandsHelp(): messagingApi.TextMessage {
  return {
    type: 'text',
    text: TEXT.help.title + TEXT.help.body,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: TEXT.help.qr.create,
            text: COMMAND.CREATE,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: TEXT.help.qr.list,
            text: COMMAND.LIST,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: TEXT.help.qr.today,
            text: COMMAND.TODAY,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: TEXT.help.qr.edit,
            text: COMMAND.EDIT,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: TEXT.help.qr.delete,
            text: COMMAND.DELETE,
          },
        },
      ],
    },
  };
}
