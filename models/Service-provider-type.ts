import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';

const ServiceProviderType = createSchema({
    nameKz: Type.string({
        required: true,
        unique: true
    }),
    nameRu: Type.string({
        required: true,
        unique: true
    }),
    image: Type.string({
        required: true,
    }),
    order: Type.number({
        required: false,
    }),
    isActive: Type.boolean({
        required: true,
        default: true
    }),
    isGovernment: Type.boolean({
        required: true,
        default: true
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('Service-provider-type', ServiceProviderType);

export type ServiceProviderTypeProps = ExtractProps<typeof ServiceProviderType>;

// export type UserDoc = ExtractDoc<typeof UserSchema>;
// export type UserProps = ExtractProps<typeof UserSchema>;

