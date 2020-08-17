import User from '@db/User';

import ERROR, {authErrors} from '@errors';

import userController from '@controllers/user'
import passwordGenerator from "generate-password";
import bus from "@modules/bus";

type userSignUpData = { password: string, name: string, email: string, phone: any, token: any };
type userSignUpWithEmailData = { email: string, token: any };
type userSignUpWithPhoneData = { phone: any, token: any };
type userLoginData = { password: string, email: string }
type userResetData = { email: string }



const signUp = async ({password, name, email, phone, token}: userSignUpData) => {

    return new Promise(async (resolve, reject) => {

        try {

            let user = await User.findOne({email});

            if (user) {
                throw new ERROR(authErrors.EMAIL_ALREADY_IN_USE);
            }

            user = await User.findOne({phone});

            if (user) {
                throw new ERROR(authErrors.PHONE_ALREADY_IN_USE);
            }

            let newUserInstance = new User({
                name,
                email,
                phone,
                token
            });

            newUserInstance.setPassword(password);

            await newUserInstance.save();

            return resolve(newUserInstance.toAuthJSON());

        } catch (err) {
            console.log(err.message);
            return reject(err);
        }

    });
};


const signUpWithEmail = async ({email, token}: userSignUpWithEmailData) => {

    return new Promise(async (resolve, reject) => {

        try {

            let user = await User.findOne({email});

            if (user) {
                throw new ERROR(authErrors.EMAIL_ALREADY_IN_USE);
            }

            let newUserInstance = new User({
                email,
                token
            });

            await newUserInstance.save();

            return resolve(newUserInstance.toAuthJSON());

        } catch (err) {
            return reject(err);
        }

    });
};


const signUpWithPhone = async ({phone, token}: userSignUpWithPhoneData) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log("Into controller");

            let user = await User.findOne({phone: {mobile: [phone]}});

            if (user) {
                return resolve(user.toAuthJSON());
                // throw new ERROR(authErrors.PHONE_ALREADY_IN_USE);
            }

            let newUserInstance = new User({
                phone: {mobile: [phone]},
                token
            });

            await newUserInstance.save();

            console.log(newUserInstance);

            // bus.emit('event.user.registered.with.phone', {
            //     userId: newUserInstance._id,
            //     phone: phone,
            // });

            return resolve(newUserInstance.toAuthJSON());

        } catch (err) {
            return reject(err);
        }

    });
};


const signIn = async ({password, email}: userLoginData) => {

    return new Promise(async (resolve, reject) => {

        try {

            let user = await User.findOne({email: email});

            if (!user) {
                throw new ERROR(authErrors.USER_NOT_FOUND);
            }

            if (!user.validatePassword(password)) {
                throw new ERROR(authErrors.INVALID_PASSWORD);
            }

            let userRole = await userController.getUserRole(user.id);

            return resolve({...user.toAuthJSON(), role: userRole});

        } catch (err) {
            console.log(err.message);
            return reject(err);
        }

    });
};


const signInNoPassword = async (email: string, phone: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            if(email) {
                let user = await User.findOne({email: email});

                if (!user) {
                    throw new ERROR(authErrors.USER_NOT_FOUND);
                }

                let userRole = await userController.getUserRole(user.id);

                return resolve({...user.toAuthJSON(), role: userRole});
            } else if (phone) {
                let user = await User.findOne({phone: {mobile: [phone]}});

                if (!user) {
                    throw new ERROR(authErrors.USER_NOT_FOUND);
                }

                let userRole = await userController.getUserRole(user.id);

                return resolve({...user.toAuthJSON(), role: userRole});
            } else {
                throw new ERROR(authErrors.USER_NOT_FOUND);
            }

        } catch (err) {
            console.log(err.message);
            return reject(err);
        }

    });
};



const reset = async ({email}: userResetData) => {

    return new Promise(async (resolve, reject) => {

        try {

            let user = await User.findOne({email: email});

            const newPassword = passwordGenerator.generate({
                length: 10,
                numbers: true
            });

            console.log({newPassword});

            user.setPassword(newPassword);
            await user.save();

            bus.emit('event.user.password.was_resetted', {
                _id: user._id,
                name: user.name,
                email,
                password: newPassword
            });

            return resolve();

        } catch (err) {
            console.log(err.message);
            return reject(err);
        }

    });
};


export = {
    signUp,
    signUpWithEmail,
    signUpWithPhone,
    signIn,
    signInNoPassword,
    reset
};

