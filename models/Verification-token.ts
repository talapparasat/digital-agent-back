import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';
import User from "@db/User";

const VerificationToken = createSchema({
    userId: Type.ref(Type.objectId({
        required: true
    })).to('Organization', User),
    token: Type.string({
        required: true,
        unique: true,
    }),
    register_date: Type.date({
        required: true,
        default: Date.now as any,
        expires: 43200
    })
});

export default typedModel('Verification-token', VerificationToken);

export type VerificationTokenProps = ExtractProps<typeof VerificationToken>;
