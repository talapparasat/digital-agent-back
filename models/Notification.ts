import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';

const Notification = createSchema({
    title: Type.string({
        required: true,
    }),
    body: Type.string({
        required: true,
    }),
    type: Type.string({
        required: true,
    }),
    date: Type.date({
        required: true,
        default: Date.now() as any
    }),
    to: Type.string({
        required: true
    }),
    sourceId: Type.string({
        required: false
    }),
    isRead: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('Notification', Notification);

export type NotificationProps = ExtractProps<typeof Notification>;
