import {
	AnyEventObject,
	AnyInterpreter,
	DefaultContext,
	EventObject,
	interpret,
	InterpreterOptions,
	InvokeCallback,
	StateMachine,
	StateSchema,
	Typestate,
} from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function invokeWebWorker<TEvent extends EventObject = AnyEventObject>(
	url: string
): () => InvokeCallback<TEvent> {
	return () => (sendBack, receive) => {
		const worker = new Worker(new URL(url, import.meta.url), { type: 'module' });
		const handler = (event: MessageEvent<TEvent>) => {
			try {
				// Will error out if the data is not a valid event
				getEventType(event.data);
				sendBack(event.data);
			} catch {}
		};
		worker.addEventListener('message', handler);

		receive((event) => {
			worker.postMessage(event);
		});

		return () => {
			worker.removeEventListener('message', handler);
			worker.terminate();
		};
	};
}

export function interpretInWorker<
	TContext = DefaultContext,
	TStateSchema extends StateSchema = any,
	TEvent extends EventObject = EventObject,
	TTypestate extends Typestate<TContext> = { value: any; context: TContext }
>(
	machine: StateMachine<TContext, TStateSchema, TEvent, TTypestate>,
	options?: Partial<InterpreterOptions>
) {
	const _self: Worker = self as any;

	const service = interpret(machine, {
		...options,
		deferEvents: true,
		parent: {
			send: (event, payload) => {
				_self.postMessage(event);
			},
		} as AnyInterpreter, // should probably be a different type
	});

	_self.addEventListener('message', (event) => {
		try {
			// Will error out if the data is not a valid event
			getEventType(event.data);
			service.send(event.data);
		} catch {}
	});

	return service;
}
