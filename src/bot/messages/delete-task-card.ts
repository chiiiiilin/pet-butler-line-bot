import { messagingApi } from '@line/bot-sdk';
import { TaskView } from '../../task/task.service';
import { ACTION } from '../lib/actions';
import { TEXT } from './text';

export function deleteTaskCarousel(
  tasks: TaskView[],
): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: TEXT.alt.deleteSelection,
    contents: {
      type: 'carousel',
      contents: tasks.slice(0, 12).map(deleteTaskBubble),
    },
  };
}

function deleteTaskBubble(task: TaskView): messagingApi.FlexBubble {
  const id = task._id;
  const freqText =
    task.intervalDays == null
      ? TEXT.freq.oneoff
      : TEXT.freq.everyDays(task.intervalDays);
  return {
    type: 'bubble',
    size: 'kilo',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: task.name,
          weight: 'bold',
          size: 'lg',
          wrap: true,
        },
        { type: 'separator', margin: 'md' },
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
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
              text: freqText,
              size: 'sm',
              flex: 5,
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#d33333',
          height: 'sm',
          action: {
            type: 'postback',
            label: TEXT.buttons.delete,
            data: `action=${ACTION.DELETE}&id=${id}`,
            displayText: TEXT.buttons.deleteDisplay,
          },
        },
      ],
    },
  };
}
