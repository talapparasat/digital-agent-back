import User from '@db/User';
import UserPosition from '@db/User-position';
import UserRole from '@db/User-role';
import O_SP from '@db/Operator_Service-provider';
import ERROR, {profileErrors} from "@errors";
import {ROLES} from "@db/Role";
import bus from "@modules/bus";
import mongoose from "mongoose";


const get = async (id: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let user = await User.findById(id);

            const position = await UserPosition.findOne({
                userId: user._id
            });

            const role = await UserRole.findOne({
                userId: user._id
            }).populateTs('roleId');

            let serviceProvider:any;
            if(role && role.roleId['name'] === ROLES.OPERATOR) {
                serviceProvider = await O_SP.findOne({
                    userId: user._id
                }).populateTs('serviceProviderId')
            }

            const result = {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                image:user.image,
                position: position?position.position:null,
                role: role?role.roleId['name']:'user',
                organization: await user.getOrganization(),
                serviceProvider: serviceProvider?serviceProvider.serviceProviderId:null,
                ...role&&role.roleId['name'] == ROLES.OPERATOR?{serviceProvider: await user.getServiceProvider()}:[]
            };

            return resolve(result);

        } catch (err) {
            return reject(err);
        }

    });
};


const changeProfile = async (userId: string, name: string, phone:string, image:string, email: string = null) => {

    return new Promise(async (resolve, reject) => {

        try {

            const user = await User.findByIdAndUpdate(userId, {
                name,
                phone,
                image,
                ...email?{email}:[]
            }, {new: true});

            return resolve(user);

        } catch (err) {
            return reject(err);
        }

    });
};


const changeProfileMobile = async (userId: string, name: string, phone:string, image:string, email: string = null, oldPhone: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const user = await User.findByIdAndUpdate(userId, {
                name,
                phone,
                image,
                ...email?{email}:[]
            }, {new: true});

            if(phone !== oldPhone) {

                await User.findByIdAndUpdate(userId, {
                    isPhoneVerified: false
                });

                // bus.emit('event.user.registered.with.phone', {
                //     userId,
                //     phone
                // });
            }
            return resolve(user);

        } catch (err) {
            return reject(err);
        }

    });
};


const changeEmail = async (userId: string, email: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const user = await User.findByIdAndUpdate(userId, {
                email
            }, {new: true});

            return resolve(user);

        } catch (err) {
            return reject(err);
        }

    });
};


const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const user = await User.findById(userId);

            if(!user.validatePassword(oldPassword)) {
                throw new ERROR(profileErrors.INCORRECT_PASSWORD)
            }

            user.setPassword(newPassword);
            await user.save();

            return resolve({success: true});

        } catch (err) {
            return reject(err);
        }

    });
};


const setPassword = async (userId: string, newPassword: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const user = await User.findById(userId);

            if(user.hash) {
                throw new ERROR(profileErrors.PASSWORD_EXIST)
            }

            user.setPassword(newPassword);
            await user.save();

            return resolve({success: true});

        } catch (err) {
            return reject(err);
        }

    });
};



export = {
    get,
    changeProfile,
    changeProfileMobile,
    changeEmail,
    changePassword,
    setPassword
};