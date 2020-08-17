import {createSchema, Type, ExtractProps, typedModel} from 'ts-mongoose';

import User from '@db/User'

const UserSMS = createSchema({
    userId: Type.ref(Type.objectId({
        required: true
    })).to('User', User),
    code: Type.string({
        required: true
    }),
    createdAt: Type.date({
        default: new Date(),
        expires: 300
    })
});

export default typedModel('User_SMS', UserSMS);

export type UserSMSProps = ExtractProps<typeof UserSMS>;
