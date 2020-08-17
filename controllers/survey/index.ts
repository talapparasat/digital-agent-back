import OSPT from "@db/Organization_Service-provider-type";

const enable = async (osptId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(osptId);

            let ospt = await OSPT.findByIdAndUpdate(osptId, {
                survey: true
            });

            return resolve(ospt);

        } catch (err) {
            return reject(err);
        }

    });
};


const disable = async (osptId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(osptId);

            let ospt = await OSPT.findByIdAndUpdate(osptId, {
                survey: false
            });

            return resolve(ospt);

        } catch (err) {
            return reject(err);
        }

    });
};

export = {
    enable,
    disable
}