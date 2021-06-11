import { createMachine, interpret, send } from 'xstate';
import { invokeWebWorker } from './invoke-worker';

const pingMachine = createMachine({
	id: 'ping',
	invoke: {
		id: 'pong',
		src: invokeWebWorker('./worker'),
	},
	entry: send({ type: 'PING' }, { to: 'pong' }),
	initial: 'active',
	states: {
		active: {
			on: {
				PONG: {
					actions: [send({ type: 'PING' }, { to: 'pong', delay: 1000 }), () => console.log('PONG')],
				},
				STOP: 'complete',
			},
		},
		complete: {},
	},
});

const service = interpret(pingMachine).start();
