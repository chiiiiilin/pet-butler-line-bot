import { messagingApi } from '@line/bot-sdk';
import { TaskView } from '../../task/task.service';
import { dateForPicker, formatDate } from '../lib/utils';
import { ACTION } from '../lib/actions';
import { TEXT } from './text';

export function editTaskCarousel(tasks: TaskView[]): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: TEXT.alt.editSelection,
    contents: {
      type: 'carousel',
      contents: tasks.slice(0, 12).map(editTaskBubble),
    },
  };
}

function editTaskBubble(task: TaskView): messagingApi.FlexBubble {
  const id = task._id;
  const v = task.cycleVersion;
  const today = dateForPicker(new Date());
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDueDate = new Date(task.nextDueAt);
  startOfDueDate.setHours(0, 0, 0, 0);
  const isOverdue = startOfDueDate < startOfToday;
  const initial = isOverdue ? today : dateForPicker(task.nextDueAt);
  const freqText =
    task.intervalDays == null
      ? TEXT.freq.oneoff
      : TEXT.freq.everyDays(task.intervalDays);

  return {
    type: 'bubble',
    size: 'mega',
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
        {
          type: 'box',
          layout: 'baseline',
          margin: 'sm',
          contents: [
            {
              type: 'text',
              text: TEXT.labels.nextDue,
              size: 'sm',
              color: '#888888',
              flex: 2,
            },
            {
              type: 'text',
              text: formatDate(task.nextDueAt),
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
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: TEXT.buttons.editName,
            data: `action=${ACTION.EDIT_NAME}&id=${id}`,
            displayText: TEXT.buttons.editNameDisplay,
          },
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: TEXT.buttons.editFreq,
            data: `action=${ACTION.EDIT_FREQ}&id=${id}`,
            displayText: TEXT.buttons.editFreqDisplay,
          },
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'datetimepicker',
            label: TEXT.buttons.editDate,
            data: `action=${ACTION.EDIT_DATE}&id=${id}&v=${v}`,
            mode: 'date',
            initial,
            min: today,
          },
        },
      ],
    },
  };
}
