export interface SafeAreaInsetsValue {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

type WebSafeAreaValue<Side extends string> = `max(${number}px, env(safe-area-inset-${Side}))`;

export interface WebSafeAreaPadding {
  readonly paddingBottom: WebSafeAreaValue<'bottom'>;
  readonly paddingLeft: WebSafeAreaValue<'left'>;
  readonly paddingRight: WebSafeAreaValue<'right'>;
  readonly paddingTop: WebSafeAreaValue<'top'>;
}

export function webSafeAreaPadding(minimum: number): WebSafeAreaPadding {
  return Object.freeze({
    paddingBottom: `max(${minimum}px, env(safe-area-inset-bottom))`,
    paddingLeft: `max(${minimum}px, env(safe-area-inset-left))`,
    paddingRight: `max(${minimum}px, env(safe-area-inset-right))`,
    paddingTop: `max(${minimum}px, env(safe-area-inset-top))`,
  });
}
