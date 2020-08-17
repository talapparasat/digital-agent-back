export {};
import bus from '@modules/bus';

bus.transmitter('event.user.registered.with.phone', 'command.notifications.send-sms');
bus.transmitter('event.user.resend.code', 'command.notifications.send-sms');
