import OSPT from '@db/Organization_Service-provider-type'

const enabre = async (osptId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let ospt = await OSPT.findByIdAndUpdate(osptId, {
                    questionnaire: true
                }, {new: true});

            return resolve(ospt);

        } catch (err) {
            return reject(err);
        }

    });

};


const disabre = async (osptId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let ospt = await OSPT.findByIdAndUpdate(osptId, {
                questionnaire: false
            }, {new: true});

            return resolve(ospt);

        } catch (err) {
            return reject(err);
        }

    });

};

export = {
    enabre,
    disabre
}