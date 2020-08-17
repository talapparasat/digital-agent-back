import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';

const Field = createSchema({
    name: Type.string({
        required: true,
        unique: true
    }),
    labelKz: Type.string({
        required: true
    }),
    labelRu: Type.string({
        required: true
    }),
    type: Type.string({
        required: true,
        enum: ['text', 'phone', 'number', 'date', 'email'],
        default: 'text'
    }),
    required: Type.boolean({
        required: true,
        default: false
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    }),
});

export default typedModel('Field', Field);

export type FieldProps = ExtractProps<typeof Field>;