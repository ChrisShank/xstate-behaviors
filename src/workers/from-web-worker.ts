import {
  AnyEventObject,
  AnyInterpreter,
  DefaultContext,
  EventObject,
  interpret,
  InterpreterOptions,
  InvokeCreator,
  StateMachine,
  StateSchema,
  Typestate,
} from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromWebWorker<TContext, TEvent extends EventObject = AnyEventObject>(
  createWorker: (context: TContext, event: TEvent) => Worker
): InvokeCreator<TContext, TEvent> {
  return (context, event) => (sendBack, receive) => {
    const worker = createWorker(context, event);
    const handler = (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    };
    worker.addEventListener('message', handler);

    receive(({ _transfer, ...event }) => {
      worker.postMessage(event, _transfer);
    });

    return () => {
      worker.removeEventListener('message', handler);
      worker.terminate();
    };
  };
}

export function interpretInWebWorker<
  TContext = DefaultContext,
  TStateSchema extends StateSchema = any,
  TEvent extends EventObject = EventObject,
  TTypestate extends Typestate<TContext> = { value: any; context: TContext }
>(
  machine: StateMachine<TContext, TStateSchema, TEvent, TTypestate>,
  options?: Partial<InterpreterOptions>
) {
  // TODO type as WorkerGlobalScope
  const _self = self as any;

  const service = interpret(machine, {
    ...options,
    deferEvents: true,
    parent: {
      send: ({ _transfer, ...event }) => {
        _self.postMessage(event, _transfer);
      },
    } as AnyInterpreter, // should probably be a different type
  });

  _self.addEventListener('message', (event: MessageEvent<TEvent>) => {
    try {
      // Will error out if the data is not a valid event
      getEventType(event.data);
      service.send(event.data);
    } catch {}
  });

  return service;
}
