import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';
import User from "@db/User";
import ServiceProvider from "@db/Service-provider";
import Category from "@db/Service-category";
import Criteria from "@db/Service-criteria";
import ServiceName from "@db/Service-name";

export const STATUSES: any = {
    SENT_TO_OPERATOR: 0,
    SENT_TO_SUPERVISOR: 2,
    RESOLVED: 5,
    CANCELED_BY_USER: 6
};


export const SEARCH_STATUSES: any = {
    ALL: [0, 2, 5, 6],
    ACTIVE: [0, 2],
    RESOLVED: [5]
};


const Review = createSchema({
    text: Type.string({
        required: false,
    }),
    rate: Type.number({
        required: true,
    }),
    ticketNumber: Type.string({
        required: false,
    }),
    userId: Type.ref(Type.objectId({
        required: false
    })).to('User', User),
    phone: Type.string({
        required: false,
    }),
    email: Type.string({
        required: false,
    }),
    image: Type.string({
        required: false,
    }),
    serviceProviderId: Type.ref(Type.objectId({
        required: true
    })).to('Service-provider', ServiceProvider),
    serviceNameId: Type.ref(Type.objectId({
        required: false
    })).to('Service-name', ServiceName),
    operatorId: Type.ref(Type.objectId({
        required: true
    })).to('User', User),
    status: Type.number({
        required: true,
        default: STATUSES.SENT_TO_OPERATOR
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    }),
    categories: [
        {
            categoryId: Type.ref(Type.objectId({
                            required: true
                        })).to('Service-category', Category),
            criterias: [
                Type.ref(Type.objectId({
                            required: true
                        })).to('Service-criteria', Criteria)
            ]
        }
    ],
    // categories: Type.array({
    //     required: false,
    //     default: null
    // }).of(
    //     Type.object({ required: true }).of({
    //         votes: Type.number({ required: true }),
    //         favs: Type.number({ required: true })
    //     })
        // Type.optionalObject({
        //     required: false
        // }).of({
        //     _id: Type.ref(Type.objectId({
        //         required: true
        //     })).to('Service-category', Category),
        //     criterias: Type.array({
        //         required: false
        //     }).of(
        //         Type.ref(Type.objectId({
        //             required: true
        //         })).to('Service-criteria', Criteria)
        //     )
        // })
    // )
}, {
    timestamps: {createdAt: 'createdAt'}
});

export default typedModel('Review', Review);

export type ReviewProps = ExtractProps<typeof Review>;

//
// let categories = [
//     {
//         id: 'dwaaw',
//         criterias: ['awdawd', 'awdawdaw', 'awdawda']
//     }
// ];
