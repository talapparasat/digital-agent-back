import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';

const ServiceCategory = createSchema({
    nameKz: Type.string({
        required: true,
    }),
    nameRu: Type.string({
        required: true,
    }),
    image: Type.string({
        required: true,
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

ServiceCategory.index({nameKz: 1, nameRu: 1}, {unique: true});

export default typedModel('Service-category', ServiceCategory);

export type ServiceCategoryProps = ExtractProps<typeof ServiceCategory>;