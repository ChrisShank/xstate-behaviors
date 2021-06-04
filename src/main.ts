import { createMachine, interpret, send, sendParent } from 'xstate';
// import ChildWorker from './worker?worker';

const pongMachine = createMachine({
	id: 'pong',
	on: {
		PING: {
			actions: [sendParent('PONG', { delay: 1000 }), () => console.log('PING')],
		},
	},
});

const pingMachine = createMachine({
	id: 'ping',
	invoke: {
		id: 'pong',
		src: pongMachine,
	},
	entry: send({ type: 'PING' }, { to: 'pong' }),
	on: {
		PONG: {
			actions: [send({ type: 'PING' }, { to: 'pong', delay: 1000 }), () => console.log('PONG')],
		},
	},
});

const service = interpret(pingMachine).start();
