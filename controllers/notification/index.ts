import Notification, {NotificationProps} from '@db/Notification';
import User from '@db/User';



const getAll = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            let notifications = await Notification.find();

            return resolve(notifications);

            // return resolve();

        } catch (err) {
            return reject(err);
        }

    });
};


const getMy = async (to: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let notifications = await Notification.find({
                to
            });

            return resolve(notifications);

        } catch (err) {
            return reject(err);
        }

    });
};


const read = async (notificationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let notification = await Notification.findByIdAndUpdate(notificationId, {
                read: true
            }, {new: true});

            return resolve(notification);

        } catch (err) {
            return reject(err);
        }

    });
};

const remove = async (notificationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let notification = await Notification.findByIdAndDelete(notificationId);

            return resolve(notification);

        } catch (err) {
            return reject(err);
        }

    });
};

const setWebToken = async (userId:string, token:string) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log({userId});
            console.log({token});

            let result = await User.findOne({
                _id: userId,
                webTokens: {
                    $ne: token
                }
            });

            console.log({result});

            await User.findOneAndUpdate({
                _id: userId,
                webTokens: {
                    $ne: token
                }
            }, {
                $push: {
                    webTokens: token
                }
            });

            return resolve({success: true});

        } catch (err) {
            return reject(err);
        }

    });
};

export = {
    getAll,
    getMy,
    read,
    remove,

    setWebToken
}