import UserSMS from "@db/User_SMS";
import User from "@db/User";
import ERROR, {verificationErrors} from "@errors";
import bus from "@modules/bus";


const verify = async (userId: string, code: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let user_sms = await UserSMS.findOne({
                userId,
                code
            });

            if (!user_sms) {
                throw new ERROR(verificationErrors.INVALID_VERIFICATION_CODE)
            }

            let verifiedUser = await User.findByIdAndUpdate(userId, {
                isPhoneVerified: true
            });

            await UserSMS.deleteMany({
                userId
            });

            return resolve({success: true});

        } catch (err) {
            return reject(err);
        }

    });
};


const resend = async (userId: string, phone: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            bus.emit('event.user.registered.with.phone', {
                userId,
                phone
            });

            return resolve({success: true});

        } catch (err) {
            return reject(err);
        }

    });
};


export = {
    verify,
    resend
}