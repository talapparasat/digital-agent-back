export {};
import bus from '@modules/bus';

bus.transmitter('event.mobile.email.received', 'command.notifications.create-notification');
bus.transmitter('event.review.created', 'command.notifications.create-notification');
// bus.transmitter('event.mobile.review.created', 'command.notifications.create-notification');
