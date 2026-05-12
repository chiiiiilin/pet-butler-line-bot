import { messagingApi } from '@line/bot-sdk';
import { TempData } from '../../state/conversation-state.schema';
import { ACTION } from '../lib/actions';
import { formatDateOnly } from '../lib/utils';

export function confirmCard(tempData: TempData): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: '確認建立任務',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '確認建立任務', weight: 'bold', size: 'lg' },
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '任務',
                size: 'sm',
                color: '#888888',
                flex: 2,
              },
              {
                type: 'text',
                text: tempData.name ?? '',
                size: 'sm',
                flex: 5,
                wrap: true,
              },
            ],
          },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'sm',
            contents: [
              {
                type: 'text',
                text: '頻率',
                size: 'sm',
                color: '#888888',
                flex: 2,
              },
              {
                type: 'text',
                text: `每 ${tempData.intervalDays} 天`,
                size: 'sm',
                flex: 5,
              },
            ],
          },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'sm',
            contents: [
              {
                type: 'text',
                text: '開始',
                size: 'sm',
                color: '#888888',
                flex: 2,
              },
              {
                type: 'text',
                text: tempData.startDate
                  ? formatDateOnly(tempData.startDate)
                  : '',
                size: 'sm',
                flex: 5,
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: '取消',
              data: `action=${ACTION.CANCEL}`,
              displayText: '取消',
            },
          },
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'postback',
              label: '確認建立',
              data: `action=${ACTION.CONFIRM}`,
              displayText: '確認建立',
            },
          },
        ],
      },
    },
  };
}
