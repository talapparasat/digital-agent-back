import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';
import Review from "@db/Review";
import Category from "@db/Service-category";
import Criteria from "@db/Service-criteria";

const ReviewCriteria = createSchema({
    text: Type.string({
        required: true,
    }),
    reviewId: Type.ref(Type.objectId({
        required: true
    })).to('Review', Review),
    serviceCategoryId: Type.ref(Type.objectId({
        required: true
    })).to('Service-category', Category),
    serviceCriteriaId:  Type.ref(Type.objectId({
        required: true
    })).to('Service-criteria', Criteria),
});

export default typedModel('Review-criteria', ReviewCriteria);

export type ReviewCriteriaProps = ExtractProps<typeof Review>;