import { messagingApi } from '@line/bot-sdk';
import { ACTION } from '../lib/actions';
import { dateForPicker } from '../lib/utils';

export function askStartDate(): messagingApi.TextMessage {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    type: 'text',
    text: '從哪一天開始？',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '今天',
            data: `action=${ACTION.START_DATE}&value=today`,
            displayText: '今天',
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '明天',
            data: `action=${ACTION.START_DATE}&value=tomorrow`,
            displayText: '明天',
          },
        },
        {
          type: 'action',
          action: {
            type: 'datetimepicker',
            label: '📅 自訂日期',
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
