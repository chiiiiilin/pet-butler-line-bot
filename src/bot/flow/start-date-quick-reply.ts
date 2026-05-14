import { messagingApi } from '@line/bot-sdk';
import { ACTION } from '../lib/actions';
import { dateForPicker } from '../lib/utils';
import { TEXT } from '../messages/text';

export function askStartDate(): messagingApi.TextMessage {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    type: 'text',
    text: TEXT.startDateQuickReply.prompt,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: TEXT.startDateQuickReply.today,
            data: `action=${ACTION.START_DATE}&value=today`,
            displayText: TEXT.startDateQuickReply.today,
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: TEXT.startDateQuickReply.tomorrow,
            data: `action=${ACTION.START_DATE}&value=tomorrow`,
            displayText: TEXT.startDateQuickReply.tomorrow,
          },
        },
        {
          type: 'action',
          action: {
            type: 'datetimepicker',
            label: TEXT.startDateQuickReply.custom,
            data: `action=${ACTION.START_DATE}`,
            mode: 'date',
            initial: dateForPicker(tomorrow),
            min: dateForPicker(today),
          },
        },
      ],
    },
  };
}
