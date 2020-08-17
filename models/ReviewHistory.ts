import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';
import Review from "@db/Review";
import {REVIEW_HISTORY_TYPES} from "@config";

const ReviewHistory = createSchema({
    type: Type.number({
        required: true
    }),
    reviewId: Type.ref(Type.objectId({
        required: true
    })).to('Review', Review),
}, {
    timestamps: {createdAt: 'createdAt'}
});

export default typedModel('Review-History', ReviewHistory);

export type ReviewHistoryProps = ExtractProps<typeof Review>;