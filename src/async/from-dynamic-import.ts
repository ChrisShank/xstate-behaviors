import {
  interpret,
  AnyInterpreter,
  StateMachine,
  InterpreterFrom,
  Behavior,
  EventObject,
} from 'xstate';
import { error } from 'xstate/lib/actions';

export type DynamicImportEvents<Machine extends StateMachine<any, any, any, any>> =
  | { type: 'fulfill'; machine: Machine }
  | { type: 'update'; state: InterpreterFrom<Machine>['state'] }
  | { type: 'reject'; error: any };

export type DynamicImportState<Machine extends StateMachine<any, any, any, any>> =
  | undefined
  | ({ status?: undefined } & InterpreterFrom<Machine>['state'])
  | { status: 'rejected'; error: any }
  | { status: 'stopped' };

export function fromDynamicImport<
  Machine extends StateMachine<any, any, any, any>,
  TEvent extends EventObject = Machine extends StateMachine<any, any, infer E, any> ? E : never
>(
  loadMachine: () => Promise<Machine>
): Behavior<DynamicImportEvents<Machine>, DynamicImportState<Machine>> {
  const initialState: DynamicImportState<Machine> = undefined;

  const pendingMessages: TEvent[] = [];
  let service: InterpreterFrom<Machine> | null = null;

  return {
    initialState,
    start({ self }) {
      loadMachine()
        .then((machine) => {
          self.send({ type: 'fulfill', machine });
        })
        .catch((error) => {
          self.send({ type: 'reject', error });
        });

      return initialState;
    },
    transition(state, event, { self, parent, id, observers }) {
      switch (event.type) {
        case 'fulfill': {
          if (state && state.status === 'stopped') break;

          service = interpret(event.machine, {
            parent: parent as AnyInterpreter,
          }).start() as InterpreterFrom<Machine>;

          service.subscribe((state) => {
            self.send({ type: 'update', state });
          });

          service.send(pendingMessages);

          return service.state as InterpreterFrom<Machine>['state'];
        }
        case 'reject': {
          parent?.send(error(id, event.error));
          observers.forEach((observer) => {
            observer.error(event.error);
          });
          return {
            status: 'rejected',
            error: event.error,
          };
        }
        case 'update': {
          observers.forEach((observer) => {
            observer.next(event.state);
          });
          return event.state;
        }
        default: {
          if (state === undefined) {
            pendingMessages.push(event);
          } else if (state.status !== 'rejected' && state.status !== 'stopped') {
            service?.send(event);
          }
        }
      }

      return state;
    },
    stop() {
      service?.stop();

      return { status: 'stopped' };
    },
  };
}
