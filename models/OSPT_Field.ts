import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';
import OSPT from "@db/Organization_Service-provider-type";
import Field from "@db/Field";

const OSPT_Field = createSchema({
    fieldId: Type.ref(Type.objectId({
        required: true
    })).to('Field', Field),
    osptId: Type.ref(Type.objectId({
        required: true
    })).to('Organization_Service-provider-type', OSPT),
    suspended: Type.boolean({
        required: true,
        default: false
    })
});

export default typedModel('OSPT_Field', OSPT_Field);

export type OSPT_FieldProps = ExtractProps<typeof OSPT_Field>;