import {createSchema, ExtractProps, Type, typedModel, } from 'ts-mongoose';
import ServiceProviderType from "@db/Service-provider-type";
import OSP from "@db/Organization_Service-provider";
import Nav from "@db/Nav";

const ServiceProvider = createSchema({
    nameKz: Type.string({
        required: true,
        unique: true
    }),
    nameRu: Type.string({
        required: true,
        unique: true
    }),
    info: Type.string({
        required: false
    }),
    address: Type.string({
        required: true
    }),
    navId: Type.ref(Type.objectId({
        required: false,
    })).to('Nav', Nav),
    coordinates: Type.array({
        required: false
    }).of(Number),
    workHours: Type.array().of({
        start: Type.string({
            required: false
        }),
        end: Type.string({
            required: false
        }),
        isWorkDay: Type.boolean({
            default: false
        })
    }),
    serviceProviderTypeId: Type.ref(Type.objectId({
        required: false,
        default: null
    })).to('Service-provider-type', ServiceProviderType),
    image: Type.string({
        required: false,
    }),
    rate: Type.number({
        required: true,
        default: 0
    }),
    reviewCount: Type.number({
        required: true,
        default: 0
    }),
    suspended: Type.boolean({
        required: true,
        default: false
    }),
    approved: Type.boolean({
        required: true,
        default: false
    })
},{
    timestamps: {createdAt: 'createdAt'}
});

// ServiceProvider.methods.getOrganization = async () => {
//     const organization = await OSP.find({
//         serviceProviderId: this._id
//     })
// };


export default typedModel('Service-provider', ServiceProvider);

export type ServiceProviderProps = ExtractProps<typeof ServiceProvider>;