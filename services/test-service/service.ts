export {};
import bus from '@modules/bus';

const testEventsLogger = (...args: any[]) => {
    console.log('test event logger: ');
};

bus.on('command.test', testEventsLogger);
