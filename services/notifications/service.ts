import bus from '@modules/bus';
import Notification, {NotificationProps} from '@db/Notification';
import socket from "@socket";


const createNotification = async (...args: any) => {
    let {text, type, to, sourceId} = args[0];

    let notification = new Notification({
        text,
        type,
        to,
        sourceId
    });

    await notification.save();

    socket.io.sockets.to(to).emit("notification.received", notification);
};


bus.on('command.notifications.create-notification', createNotification);

export {};
