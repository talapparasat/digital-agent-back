    import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';
import Review from "@db/Review";
import Field from "@db/Field";

const Review_Field = createSchema({
    fieldId: Type.ref(Type.objectId({
        required: true
    })).to('Field', Field),
    reviewId: Type.ref(Type.objectId({
        required: true
    })).to('Review', Review),
    value: Type.string({
        required: true,
    })
});

export default typedModel('Review_Field', Review_Field);

export type Review_FieldProps = ExtractProps<typeof Review_Field>;