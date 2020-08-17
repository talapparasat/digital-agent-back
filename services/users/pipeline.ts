export {};
import bus from '@modules/bus';

bus.transmitter('event.organisations.users.created', 'command.users.send-credentials');
bus.transmitter('event.user.password.was_resetted', 'command.users.send-new-password');
bus.transmitter('event.review.email.sent', 'command.reviews.send-email');
