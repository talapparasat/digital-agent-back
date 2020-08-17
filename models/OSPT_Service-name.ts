import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';
import OSPT from "@db/Organization_Service-provider-type";
import ServiceName from '@db/Service-name';


const OSPTServiceName = createSchema({
    osptId: Type.ref(Type.objectId({
        required: true
    })).to('Organization_Service-provider-type', OSPT),
    serviceNameId:  Type.ref(Type.objectId({
        required: true
    })).to('Service-name', ServiceName),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('O_SPT_ServiceName', OSPTServiceName);

export type OSPTServiceNameProps = ExtractProps<typeof OSPTServiceName>;