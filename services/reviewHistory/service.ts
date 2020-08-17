import bus from '@modules/bus';
import Notification, {NotificationProps} from '@db/Notification';
import ReviewHistory, {ReviewHistoryProps} from '@db/ReviewHistory';
import socket from "@socket";


const createHistory = async (...args: any) => {
    // let {text, type, to, sourceId} = args[0];

    let {reviewId, type} = args[0];

    let history = new ReviewHistory({
        reviewId,
        type
    });

    await history.save();
};


bus.on('command.history.create-history', createHistory);

export {};
