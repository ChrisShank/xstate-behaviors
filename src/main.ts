import { createMachine, interpret, send } from 'xstate';
import { invokeWebWorker } from './invoke-worker';
import ChildWorker from './worker?worker';

const pingMachine = createMachine({
	id: 'ping',
	invoke: {
		id: 'pong',
		src: invokeWebWorker(new ChildWorker()),
	},
	entry: send({ type: 'PING' }, { to: 'pong' }),
	on: {
		PONG: {
			actions: [send({ type: 'PING' }, { to: 'pong', delay: 1000 }), () => console.log('PONG')],
		},
	},
});

const service = interpret(pingMachine).start();
