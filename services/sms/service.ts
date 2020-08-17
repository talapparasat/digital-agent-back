import request from "request"
import UserSMS from "@db/User_SMS";
import bus from "@modules/bus";
import { smsService } from "@config"

const sendSMSWithCode = async (...args: any) => {
    console.log("Inside sms");

    let {userId, phone} = args[0];

    const code = generateCode();

    let phone_number = convertPhone(phone);
    var text = "Vash kod:" + code + '\ndigitalagent.kz'; //'Vash kod potverzhdenia ot prilozhenia Digital Agent KZ: '+ code;
    var getUrl = smsService.url + 'recipient=' + phone_number + '&messagetype=' + smsService.messagetype + '&originator=' + smsService.originator + '&messagedata=' + text;

    sendSMS(getUrl);

    await createUserSMS(userId, code)

};

const sendSMS = (getUrl: string) => {
    let options = {
        method: 'GET',
        url: getUrl
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log(error)
        } else {
            console.log(body)
        }
    });
};


const generateCode = () => {
    return (
        Math.round(Math.random() * 9) + '' +
        Math.round(Math.random() * 9) + '' +
        Math.round(Math.random() * 9) + '' +
        Math.round(Math.random() * 9)
    )
};

const convertPhone = (phone:string) => {
    phone = phone.replace(/\D/g, "");
    phone = phone.slice(-10);
    phone = '7' + phone;
    return (phone)
};

const createUserSMS = async (userId:string, code:string) => {

    await UserSMS.deleteMany({
        userId
    });

    let newUserSMS = new UserSMS({
        userId,
        code
    });

    await newUserSMS.save()

};



bus.on('command.notifications.send-sms', sendSMSWithCode);