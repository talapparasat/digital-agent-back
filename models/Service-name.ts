import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';

const ServiceName = createSchema({
    nameKz: Type.string({
        required: true,
    }),
    nameRu: Type.string({
        required: true,
    }),
    code: Type.string({
        required: false
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    })

});

ServiceName.index({nameKz: 1, nameRu: 1}, {unique: true});

export default typedModel('Service-name', ServiceName);

export type ServiceNameProps = ExtractProps<typeof ServiceName>;