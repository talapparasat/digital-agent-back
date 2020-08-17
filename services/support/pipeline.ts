export {};
import bus from '@modules/bus';

bus.transmitter('event.problem.message.written', 'command.send.problem.message');
