import { createSchema, Type, ExtractProps, typedModel } from 'ts-mongoose';

import User from '@db/User'

const UserPosition = createSchema({
    userId: Type.ref(Type.objectId({
        required: true
    })).to('User', User),
    position: Type.string({
        required: true
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('User-position', UserPosition);

export type UserPositionProps = ExtractProps<typeof UserPosition>;
