import { createSchema, Type, ExtractProps, typedModel } from 'ts-mongoose';

import ServiceProvider from '@db/Service-provider'
import User from '@db/User'

const SupervisorServiceProvider = createSchema({
    userId: Type.ref(Type.objectId({
        required: true
    })).to('User', User),
    serviceProviderId: Type.ref(Type.objectId({
        required: true
    })).to('Service-provider', ServiceProvider),
});

export default typedModel('Supervisor_Service-provider', SupervisorServiceProvider);

export type SupervisorServiceProviderProps = ExtractProps<typeof SupervisorServiceProvider>;
