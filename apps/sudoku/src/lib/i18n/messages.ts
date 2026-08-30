import ko from './ko.ts';

export type MessageKey = keyof typeof ko;
export type MessageDictionary = Record<MessageKey, string>;
