import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';
import OSPT from "@db/Organization_Service-provider-type";
import Nav from "@db/Nav";

const NavOSPT = createSchema({
    navId: Type.ref(Type.objectId({
        required: false
    })).to('Nav', Nav),
    osptId: Type.ref(Type.objectId({
        required: false
    })).to('Organization_Service-provider-type', OSPT)
});

export default typedModel('Nav_OSPT', NavOSPT);

export type NavOSPTProps = ExtractProps<typeof NavOSPT>;