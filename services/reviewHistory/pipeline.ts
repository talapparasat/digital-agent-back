export {};
import bus from '@modules/bus';

bus.transmitter('event.review.status.changed', 'command.history.create-history');
