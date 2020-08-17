import events from 'events';

const bus: any = new events.EventEmitter();

bus.transmitter = (event: string, command: string) => {
    const transmit = (...args: any) => {
        bus.emit(command, ...args);
    };

    bus.on(event, transmit)
};

export default bus;


// bus.on('event', console.log);
// bus.trigger('event', { foo: 42 });
