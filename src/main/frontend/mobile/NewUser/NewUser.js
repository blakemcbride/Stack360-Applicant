/*
    STACK360 - Web-based Business Management System
    Copyright (C) 2024 Arahant LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see https://www.gnu.org/licenses.
*/

/**
 * Author: Blake McBride
 * Date: 12/21/22
 */

'use strict';

(function () {

    $('thank-you').html(`Thank you for taking the time to apply at 
      <b>` + GlobalData.CompanyName + `</b>. We are happy you are taking this step!`);

    const argv = Utils.getPageArgv();

    $$('email').setValue(argv.username);

    $$('create-login').onclick(() => {
        if ($$('first-name').isError('First name'))
            return;
        if ($$('last-name').isError('Last name'))
            return;
        if ($$('email').isError('Email'))
            return;
        const email = $$('email').getValue();
        if (!Utils.isValidEmailAddress(email)) {
            Utils.showMessage('Error', email + ' is not a valid email address');
            return;
        }
        if ($$('phone').isError('Mobile phone'))
            return;
        if ($$('email-auth').getValue() !== "Y") {
            Utils.showMessage('Error', 'In order to continue, you must authorize us to send emails to you.');
            return;
        }
        if ($$('text-auth').getValue() !== "Y") {
            Utils.showMessage('Error', 'In order to continue, you must authorize us to send text messages to you.');
            return;
        }
        const data = {
            fname: $$('first-name').getValue(),
            mname: $$('middle-name').getValue(),
            lname: $$('last-name').getValue(),
            email: email,
            phone: $$('phone').getValue()
        }
        Utils.waitMessage('Creating your login.  Please wait.');
        Server.call(Framework.REST, 'CreateLogin', data).then(async res => {
            Utils.waitMessageEnd();
            if (res._Success) {
                await Utils.showMessage('Status', 'An email was sent to you.  It will provide a link for you to validate your email address with.  You will then be able to continue with the application process. (Please be sure to check your spam folder.)');
                Framework.logout();
            }
        });
    });

    $$('cancel').onclick(() => {
        Utils.popPage();
    });

})();
