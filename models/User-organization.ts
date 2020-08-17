import { createSchema, Type, ExtractProps, typedModel } from 'ts-mongoose';

import User from '@db/User'
import Organization from '@db/Organization'

const UserOrganization = createSchema({
    userId: Type.ref(Type.objectId({
        required: true
    })).to('User', User),
    organizationId: Type.ref(Type.objectId({
        required: true
    })).to('Organization', Organization),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('User-organization', UserOrganization);

export type OrganizationProps = ExtractProps<typeof UserOrganization>;

