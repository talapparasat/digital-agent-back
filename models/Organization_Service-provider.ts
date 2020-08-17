import { createSchema, Type, ExtractProps, typedModel } from 'ts-mongoose';

import Organization from '@db/Organization'
import ServiceProvider from '@db/Service-provider'

const OrganizationServiceProvider = createSchema({
    organizationId: Type.ref(Type.objectId({
        required: true
    })).to('Organization', Organization),
    serviceProviderId: Type.ref(Type.objectId({
        required: true
    })).to('Service-provider', ServiceProvider),
    suspended: Type.boolean({
        required: true,
        default: false
    })
}, {});

export default typedModel('Organization_Service-provider', OrganizationServiceProvider);

export type OrganizationServiceProviderProps = ExtractProps<typeof OrganizationServiceProvider>;
