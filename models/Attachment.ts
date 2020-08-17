    import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';

const Attachment = createSchema({
    file_path: Type.string({
        required: true,
        unique: true
    }),
    mime_type: Type.string({
        required: true
    }),
});

export default typedModel('Attachment', Attachment);

export type AttachmentProps = ExtractProps<typeof Attachment>;
