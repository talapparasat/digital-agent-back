import { createSchema, Type, ExtractProps, typedModel } from 'ts-mongoose';
import OSPT from '@db/Organization_Service-provider-type';
import ServiceCategory from '@db/Service-category';

const OSPTServiceCategory = createSchema({
    osptId: Type.ref(Type.objectId({
        required: true
    })).to('Organization_Service-provider-type', OSPT),
    serviceCategoryId: Type.ref(Type.objectId({
        required: true
    })).to('Service-category', ServiceCategory),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('OSPT_Service-category', OSPTServiceCategory);

export type OSPTServiceCateogoryProps = ExtractProps<typeof OSPTServiceCategory>;