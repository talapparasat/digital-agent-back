import { createSchema, Type, ExtractProps, typedModel } from 'ts-mongoose';

import ServiceProvider from '@db/Service-provider'
import User from '@db/User'

const OperatorServiceProvider = createSchema({
    userId: Type.ref(Type.objectId({
        required: true
    })).to('User', User),
    serviceProviderId: Type.ref(Type.objectId({
        required: true
    })).to('Service-provider', ServiceProvider),
});

export default typedModel('Operator_Service-provider', OperatorServiceProvider);

export type OperatorServiceProviderProps = ExtractProps<typeof OperatorServiceProvider>;
