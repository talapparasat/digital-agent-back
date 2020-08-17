export {};
import bus from '@modules/bus';

bus.on('event.test', (...args: any) => {
    args.forEach((a: any) => {
        console.log(a);
    });
    bus.emit('command.test');
});
