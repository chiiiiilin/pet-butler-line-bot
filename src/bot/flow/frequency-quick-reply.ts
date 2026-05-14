import { messagingApi } from '@line/bot-sdk';
import { ACTION } from '../lib/actions';
import { TEXT } from '../messages/text';

export function askFrequency(): messagingApi.TextMessage {
  return {
    type: 'text',
    text: TEXT.freqQuickReply.prompt,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: TEXT.freqQuickReply.daily,
            data: `action=${ACTION.FREQ}&value=1`,
            displayText: TEXT.freqQuickReply.daily,
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: TEXT.freqQuickReply.weekly,
            data: `action=${ACTION.FREQ}&value=7`,
            displayText: TEXT.freqQuickReply.weekly,
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: TEXT.freqQuickReply.monthly,
            data: `action=${ACTION.FREQ}&value=30`,
            displayText: TEXT.freqQuickReply.monthly,
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: TEXT.freqQuickReply.quarterly,
            data: `action=${ACTION.FREQ}&value=90`,
            displayText: TEXT.freqQuickReply.quarterly,
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: TEXT.freqQuickReply.custom,
            data: `action=${ACTION.FREQ}&value=custom`,
            displayText: TEXT.freqQuickReply.custom,
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: TEXT.freqQuickReply.oneoff,
            data: `action=${ACTION.FREQ}&value=oneoff`,
            displayText: TEXT.freqQuickReply.oneoff,
          },
        },
      ],
    },
  };
}
