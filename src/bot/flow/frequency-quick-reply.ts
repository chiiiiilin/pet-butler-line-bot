import { messagingApi } from '@line/bot-sdk';
import { ACTION } from '../lib/actions';

export function askFrequency(): messagingApi.TextMessage {
  return {
    type: 'text',
    text: '請選擇頻率：',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '每天',
            data: `action=${ACTION.FREQ}&value=1`,
            displayText: '每天',
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '每週',
            data: `action=${ACTION.FREQ}&value=7`,
            displayText: '每週',
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '每月',
            data: `action=${ACTION.FREQ}&value=30`,
            displayText: '每月',
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '自訂天數',
            data: `action=${ACTION.FREQ}&value=custom`,
            displayText: '自訂天數',
          },
        },
      ],
    },
  };
}
