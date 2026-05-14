import { messagingApi } from '@line/bot-sdk';
import { TempData } from '../../state/conversation-state.schema';
import { ACTION } from '../lib/actions';
import { formatDateOnly } from '../lib/utils';
import { TEXT } from '../messages/text';

export function confirmCard(tempData: TempData): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: TEXT.alt.confirmCreate,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: TEXT.confirmCard.title,
            weight: 'bold',
            size: 'lg',
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: TEXT.labels.task,
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
                text: TEXT.labels.frequency,
                size: 'sm',
                color: '#888888',
                flex: 2,
              },
              {
                type: 'text',
                text:
                  tempData.intervalDays == null
                    ? TEXT.freq.oneoff
                    : TEXT.freq.everyDays(tempData.intervalDays),
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
                text: TEXT.labels.startDate,
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
              label: TEXT.buttons.cancel,
              data: `action=${ACTION.CANCEL}`,
              displayText: TEXT.buttons.cancel,
            },
          },
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'postback',
              label: TEXT.buttons.confirmCreate,
              data: `action=${ACTION.CONFIRM}`,
              displayText: TEXT.buttons.confirmCreate,
            },
          },
        ],
      },
    },
  };
}
