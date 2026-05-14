import { messagingApi } from '@line/bot-sdk';
import { TaskView } from '../../task/task.service';
import { dateForPicker, formatDate, formatDateTime } from '../lib/utils';
import { ACTION } from '../lib/actions';
import { TEXT } from './text';

export function taskListCarousel(
  tasks: TaskView[],
  nameMap: Map<string, string>,
): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: TEXT.alt.taskList,
    contents: {
      type: 'carousel',
      contents: tasks.slice(0, 12).map((t) => taskBubble(t, nameMap)),
    },
  };
}

export function taskDetailCard(
  task: TaskView,
  nameMap: Map<string, string>,
): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: task.name,
    contents: taskBubble(task, nameMap),
  };
}

function taskBubble(
  task: TaskView,
  nameMap: Map<string, string>,
): messagingApi.FlexBubble {
  const id = task._id;
  const today = dateForPicker(new Date());

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDueDate = new Date(task.nextDueAt);
  startOfDueDate.setHours(0, 0, 0, 0);
  const isOverdue = startOfDueDate < startOfToday;
  const daysOverdue = isOverdue
    ? Math.round(
        (startOfToday.getTime() - startOfDueDate.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const initial = isOverdue ? today : dateForPicker(task.nextDueAt);

  const bodyContents: messagingApi.FlexComponent[] = [
    {
      type: 'text',
      text: task.name,
      weight: 'bold',
      size: 'lg',
      wrap: true,
    },
  ];

  if (isOverdue) {
    bodyContents.push({
      type: 'text',
      text: TEXT.overdue.long(daysOverdue),
      size: 'sm',
      color: '#d33333',
      margin: 'sm',
    });
  }

  const freqText =
    task.intervalDays == null
      ? TEXT.freq.oneoff
      : TEXT.freq.everyDays(task.intervalDays);

  bodyContents.push(
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
  );

  if (task.lastCompletion) {
    const byName =
      nameMap.get(task.lastCompletion.userId) ?? task.lastCompletion.userId;
    const completedText = `${formatDateTime(task.lastCompletion.completedAt)} (${byName})`;
    bodyContents.push({
      type: 'box',
      layout: 'baseline',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: TEXT.labels.lastDone,
          size: 'sm',
          color: '#888888',
          flex: 2,
        },
        {
          type: 'text',
          text: completedText,
          size: 'sm',
          flex: 5,
          wrap: true,
        },
      ],
    });
  }

  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: bodyContents,
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'md',
          action: {
            type: 'postback',
            label: TEXT.buttons.complete,
            data: `action=${ACTION.COMPLETE}&id=${id}`,
            displayText: TEXT.buttons.complete,
          },
        },
        {
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'datetimepicker',
            label: TEXT.buttons.snooze,
            data: `action=${ACTION.SNOOZE}&id=${id}`,
            mode: 'date',
            initial,
            min: today,
          },
        },
      ],
    },
  };
}
