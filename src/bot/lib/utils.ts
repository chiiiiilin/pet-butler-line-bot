import { messagingApi } from '@line/bot-sdk';

export function textMsg(text: string): messagingApi.TextMessage {
  return { type: 'text', text };
}

export function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} ${hh}:${mm}`;
}

export function dateForPicker(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function formatDateOnly(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
}
