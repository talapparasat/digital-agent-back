import {emailConfig, supportTeamEmail} from "@config";
import bus from "@modules/bus";
const nodemailer = require('nodemailer');


const sendProblemMessage = (...args: any) => {

    const sendMail = async ({ mailserver, mail } : any) => {
        let transporter = nodemailer.createTransport(mailserver);

        let info = await transporter.sendMail(mail);

        console.log(`Preview: ${nodemailer.getTestMessageUrl(info)}`);
    };

    let html = [
        '<h2>Новое сообщение о проблеме от мобильного приложения</h2>',
        '<p>' + args[0].message + '</p>'
    ];

    if(args[0].name || args[0].email || args[0].phone) {
        html.push('<p><b>Пользователь:</b></p>');
        if(args[0].name) {
            html.push('<p>Имя: ' + args[0].name + '</p>')
        }

        if(args[0].email) {
            html.push('<p>Почта: ' + args[0].email + '</p>')
        }

        if(args[0].phone) {
            html.push('<p>Телефон: ' + args[0].phone + '</p>')
        }
    }

    let config = {
        mailserver: emailConfig,
        mail: {
            from: 'Digital Agent mailer@api2.digitalagent.kz',
            to: supportTeamEmail.email,
            subject: 'Новое сообщение о проблеме от мобильного приложения',
            html: html.join("")
        }
    };

    sendMail(config).catch(console.error);
};

bus.on('command.send.problem.message', sendProblemMessage);
