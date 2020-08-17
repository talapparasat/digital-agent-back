import { createSchema, Type, ExtractProps, typedModel } from 'ts-mongoose';

import Organization from '@db/Organization'
import ServiceProviderType from '@db/Service-provider-type'

const OrganizationServiceProviderType = createSchema({
    organizationId: Type.ref(Type.objectId({
        required: true
    })).to('Organization', Organization),
    serviceProviderTypeId: Type.ref(Type.objectId({
        required: true
    })).to('Service-provider-type', ServiceProviderType),
    survey: Type.boolean({
        required: false
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('Organization_Service-provider-type', OrganizationServiceProviderType);

export type OrganizationServiceProviderTypeProps = ExtractProps<typeof OrganizationServiceProviderType>;
