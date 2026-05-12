import { messagingApi } from '@line/bot-sdk';
import { TaskDocument } from '../../task/task.schema';
import { ACTION } from '../lib/actions';

export type CardContext = 'morning' | 'evening' | 'today';

export function dailyTaskCard(
  tasks: TaskDocument[],
  intro: string,
  context: CardContext = 'today',
): messagingApi.FlexMessage {
  const heroText = context === 'evening' ? 'Final Check' : 'Ready, Human?';
  const heroUrl = `https://cataas.com/cat/says/${encodeURIComponent(heroText)}?_=${Date.now()}`;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const bodyContents: messagingApi.FlexComponent[] = [
    { type: 'text', text: intro, weight: 'bold', size: 'md', wrap: true },
    { type: 'separator', margin: 'md' },
  ];

  tasks.forEach((task, i) => {
    bodyContents.push(taskRow(task, startOfToday));
    if (i < tasks.length - 1) {
      bodyContents.push({ type: 'separator', margin: 'sm' });
    }
  });

  return {
    type: 'flex',
    altText: intro,
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: heroUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: bodyContents,
      },
    },
  };
}

function taskRow(
  task: TaskDocument,
  startOfToday: Date,
): messagingApi.FlexBox {
  const id = String(task._id);
  const isOverdue = task.nextDueAt < startOfToday;
  const daysOverdue = isOverdue
    ? Math.floor(
        (startOfToday.getTime() - task.nextDueAt.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const contents: messagingApi.FlexComponent[] = [
    {
      type: 'text',
      text: task.name,
      weight: 'bold',
      size: 'md',
      flex: 1,
    },
  ];

  if (isOverdue) {
    contents.push({
      type: 'text',
      text: `🔴 ${daysOverdue} 天`,
      size: 'sm',
      color: '#d33333',
      flex: 0,
      margin: 'sm',
    });
  }

  contents.push({
    type: 'text',
    text: '›',
    color: '#aaaaaa',
    size: 'xl',
    flex: 0,
    margin: 'sm',
  });

  return {
    type: 'box',
    layout: 'baseline',
    margin: 'md',
    paddingAll: 'sm',
    action: {
      type: 'postback',
      label: task.name,
      data: `action=${ACTION.SHOW}&id=${id}`,
    },
    contents,
  };
}
