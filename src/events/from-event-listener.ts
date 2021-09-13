import { InvokeCallback } from 'xstate';

export function fromEventListener<E extends keyof WindowEventMap>(
  eventName: E
): () => InvokeCallback<WindowEventMap[E]> {
  return () => (sendBack) => {
    addEventListener(eventName, (e) => sendBack(e));
    return () => {
      removeEventListener(eventName, (e) => sendBack(e));
    };
  };
}
