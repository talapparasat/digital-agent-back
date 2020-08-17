import https from 'https';
import puppeteer from 'puppeteer'
import analyticsController from "@controllers/analytics/index";

const main = async () => {

    return new Promise(async (resolve, reject) => {

        try {
            const [
                telegramCount,
                instagramCount,
                facebookCount
            ] = await Promise.all([
                telegram(),
                instagram(),
                facebook()
            ]);

            return resolve({
                telegram: telegramCount,
                instagram: instagramCount,
                facebook: facebookCount
            })

        } catch (err) {
            return reject(err);
        }

    });
};

const telegram = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            https.get('https://t.me/mosrpkz', (resp) => {
                let data = '';

                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', () => {

                    const match = data.match(/([\d ]+) members/);

                    if(match) {
                        let count = Number.parseInt(match[1].replace(" ", ''));

                        return resolve(count)
                    }

                    return resolve(0)

                });

            }).on("error", (err) => {
                console.log("Error: " + err.message);
                return reject(err)
            });

        } catch (err) {
            return reject(err);
        }

    });
};


const instagram = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            https.get('https://www.instagram.com/navyki_i_rabochie_mesta/', (resp) => {
                let data = '';

                resp.setEncoding('utf8');
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', () => {

                    const match = data.match(/"count":(\d+)/);

                    if(match) {
                        const count = Number.parseInt(match[1]);
                        console.log(count);

                        return resolve(count)
                    }

                    return resolve(0)

                });

            }).on("error", (err) => {
                console.log("Error: " + err.message);
                return reject(err)
            });

        } catch (err) {
            return reject(err);
        }

    });
};


const facebook = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            // const browser = await puppeteer.launch({args: ['--no-sandbox']});
            // const page = await browser.newPage();
            //
            // await page.goto('https://www.facebook.com/pg/skillsandjobs2020/community/?ref=page_internal');
            //
            // await page.waitForSelector('#u_0_o > div:nth-child(1) > div > div > div > div > div > div > div:nth-child(2) > div._3xom');
            //
            // let countString = await page.evaluate(() => {
            //     return document.querySelector('#u_0_o > div:nth-child(1) > div > div > div > div > div > div > div:nth-child(2) > div._3xom').textContent;
            // });
            //
            // const count = Number.parseInt(countString.replace(',', ''));
            //
            // browser.close();

            const count = 2497;

            return resolve(count)

        } catch (err) {
            return reject(err);
        }

    });
};

export = {
    main
}