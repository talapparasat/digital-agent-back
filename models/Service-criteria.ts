import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';

const ServiceCriteria = createSchema({
    nameKz: Type.string({
        required: true,
    }),
    nameRu: Type.string({
        required: true,
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

ServiceCriteria.index({nameKz: 1, nameRu: 1}, {unique: true});

export default typedModel('Service-criteria', ServiceCriteria);

export type ServiceCriteriaProps = ExtractProps<typeof ServiceCriteria>;