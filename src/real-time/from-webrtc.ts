import { EventObject, AnyEventObject, InvokeCreator } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

// TODO: figure out how webRTC works
export function fromWebSocket<TContext, TEvent extends EventObject = AnyEventObject>(
  createWebRTC: (context: TContext, event: TEvent) => any
): InvokeCreator<TContext, TEvent> {
  return (context, event) => (sendBack, receive) => {};
}
