import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';

const Organization = createSchema({
    nameKz: Type.string({
        required: true,
        unique: true
    }),
    nameRu: Type.string({
        required: true,
        unique: true,
    }),
    image: Type.string({
        required: true,
        default:  "29acf3c8-fa69-4420-a8da-40f820448a4d.jpg"
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('Organization', Organization);

export type OrganizationProps = ExtractProps<typeof Organization>;