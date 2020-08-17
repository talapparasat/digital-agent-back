import { createSchema, Type, ExtractProps, typedModel } from 'ts-mongoose';

import OSPTServiceCategory from '@db/OSPT_Service-category';
import ServiceCriteria from '@db/Service-criteria';

const OSPT_SC_ServiceCriteria = createSchema({
    osptServiceCategoryId: Type.ref(Type.objectId({
        required: true
    })).to('OSPT_Service-category', OSPTServiceCategory),
    serviceCriteriaId: Type.ref(Type.objectId({
        required: true
    })).to('Service-criteria', ServiceCriteria),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('OSPT_SC_SC', OSPT_SC_ServiceCriteria);

export type OSPT_SC_ServiceCriteriaProps = ExtractProps<typeof OSPT_SC_ServiceCriteria>;
