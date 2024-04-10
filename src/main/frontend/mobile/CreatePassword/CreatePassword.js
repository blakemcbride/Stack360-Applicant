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
 * Date: 12/28/22
 */

'use strict';


(function () {

    $('#company-name').text(GlobalData.CompanyName);
    $('#company-logo').attr('src', GlobalData.logoFile);
    $('#company-logo').css(GlobalData.logoStyle);

    function setPassword() {
        if ($$('password1').isError("New Password")) {
            $$('password1').clear();
            $$('password2').clear();
            return;
        }
        const pw1 = $$('password1').getValue();
        const pw2 = $$('password2').getValue();
        if (pw1 !== pw2) {
            Utils.showMessage('Error', 'The two passwords do not match.  Please re-enter the same password twice.');
            $$('password1').clear();
            $$('password2').clear();
            return;
        }
        const nlower = pw1.replace(/[^a-z]/g, '').length;
        const nupper = pw1.replace(/[^A-Z]/g, '').length;
        const ndigits = pw1.replace(/^0-9/g, '').length;
        const nspecial = pw1.replace(/^0-9a-zA-Z/g, '').length;
        if (!nlower || !nupper || !ndigits) {
            Utils.showMessage('Error', 'Passwords must have at least one lowercase letter, one uppercase letter, and one number.  Please create a different password.');
            $$('password1').clear();
            $$('password2').clear();
            return;
        }
        const data = {
            user: Utils.user,
            auth: Utils.auth,
            password: pw1
        }
        Server.call(Framework.REST, 'CreatePassword', data).then(async res => {
            if (res._Success) {
                await Utils.showMessage('Status', 'The password you entered has been applied to your account.  You may use it to login from now on.');

                // login the user
                AWS.setUser(Utils.user, pw1);
                const data = await AWS.callSoap('Main', 'login');
                $$('password1').clear();
                $$('password2').clear();
                if (data.wsStatus === "0") {
                    /*
                    AWS.setUuid(data.uuid);
                    AWS.setCompanyId(data.company.id);
                    AWS.personId = data.personId;
                    Framework.userInfo = data.personFName + ' ' + data.personLName;

                    // prevent accidental browser back button
                    window.onbeforeunload = function () {
                        return "Back button hit.";
                    };
                    Utils.loadPage('mobile/Main/Main');
                    */

                    // for some reason, the above doesn't work so, for now, we'll just make them login again
                    AWS.logout();
                    window.onbeforeunload = null;  //  allow back button again
                    window.location.href = window.location.origin + window.location.pathname;
                }
            }
        });
    }

    $$('set-password').onclick(setPassword);

    $$('password2').onEnter(setPassword);

    $$('cancel').onclick(() => {
        window.location.href = window.location.origin + window.location.pathname;
    });

})();


    