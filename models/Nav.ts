import {createSchema, ExtractProps, Type, typedModel} from 'ts-mongoose';

const Nav = createSchema({
    prevId: Type.ref(Type.objectId({
        required: false
    })).to('Nav', this),
    nameKz: Type.string({
        required: true
    }),
    nameRu: Type.string({
        required: true
    }),
    order: Type.number(),
    coordinates: Type.array({
        required: false
    }).of(Number),
});

export default typedModel('Nav', Nav);

export type NavProps = ExtractProps<typeof Nav>;
