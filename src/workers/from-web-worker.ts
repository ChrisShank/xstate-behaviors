import {
  AnyEventObject,
  AnyInterpreter,
  Behavior,
  DefaultContext,
  EventObject,
  interpret,
  InterpreterOptions,
  StateMachine,
  StateSchema,
  Typestate,
} from 'xstate';
import { error } from 'xstate/lib/actions';
import { getEventType } from 'xstate/lib/utils';

type WebWorkerEvents<TEvent extends EventObject> =
  | { type: 'error'; error: ErrorEvent | Event }
  | { type: 'message'; message: TEvent };

type WebWorkerState<TEvent extends EventObject = AnyEventObject> =
  | { status: 'idle' }
  | { status: 'active'; message: TEvent }
  | { status: 'error'; error: ErrorEvent | Event }
  | { status: 'terminated' };

export function fromWebWorker<TEvent extends EventObject = AnyEventObject>(
  createWorker: () => Worker
): Behavior<WebWorkerEvents<TEvent>, WebWorkerState<TEvent>> {
  const initialState: WebWorkerState<TEvent> = { status: 'idle' };

  let worker: Worker | undefined;
  let onMessage: (event: MessageEvent<TEvent>) => void;
  let onMessageError: (event: Event) => void;
  let onError: (event: ErrorEvent) => void;

  return {
    initialState,
    start({ self }) {
      worker = createWorker();

      onMessage = (event: MessageEvent<TEvent>) => {
        try {
          // Will error out if the data is not a valid event
          getEventType(event.data);
          self.send({ type: 'message', message: event.data });
        } catch {}
      };

      worker.addEventListener('message', onMessage);

      onMessageError = (event) => {
        self.send({ type: 'error', error: event });
      };
      worker.addEventListener('message error', onMessageError);

      onError = (event) => {
        self.send({ type: 'error', error: event });
      };
      worker.addEventListener('error', onError);

      return initialState;
    },
    transition(state, event, { parent, id }) {
      switch (event.type) {
        case 'message': {
          parent?.send(event.message);
          return { status: 'active', message: event.message };
        }
        case 'error': {
          parent?.send(error(id, event));
          return { status: 'error', error: event.error };
        }
        default: {
          const { _transfer, ..._event } = event as any;
          worker?.postMessage(_event, _transfer);
          return state;
        }
      }
    },
    stop() {
      worker?.removeEventListener('message', onMessage);
      worker?.removeEventListener('messageerror', onMessageError);
      worker?.removeEventListener('error', onError);
      worker?.terminate();

      return { status: 'terminated' };
    },
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
