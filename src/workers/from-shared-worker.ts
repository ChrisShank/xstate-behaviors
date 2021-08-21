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

export function fromSharedWorker<TContext, TEvent extends EventObject = AnyEventObject>(
  createWorker: (context: TContext, event: TEvent) => SharedWorker
): InvokeCreator<TContext, TEvent> {
  return (context, event) => (sendBack, receive) => {
    const worker = createWorker(context, event);

    worker.port.start();

    const handler = (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    };

    worker.port.addEventListener('message', handler);

    receive((event) => {
      worker.port.postMessage(event);
    });

    return () => {
      worker.port.removeEventListener('message', handler);
      worker.port.close();
    };
  };
}

export function interpretInSharedWorker<
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
      send: (event) => {
        _self.postMessage(event);
      },
    } as AnyInterpreter, // should probably be a different type
  });

  _self.addEventListener('connect' as any, (event: MessageEvent) => {
    const [port] = event.ports;

    port.addEventListener('message', (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        service.send(event.data);
      } catch {}
    });
  });

  return service;
}
