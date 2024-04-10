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
 * Date: 1/2/23
 */

'use strict';

(function () {

    const app = Utils.getData("application");

    $('#company-name').text(GlobalData.CompanyNameMedium);

    switch (app.years_experience) {
        case 0:
            $$('years-experience').setValue('0');
            break;
        case 1:
            $$('years-experience').setValue('1');
            break;
        case 3:
            $$('years-experience').setValue('3');
            break;
        case 5:
            $$('years-experience').setValue('5');
            break;
        default:
            $$('years-experience').setValue('');
            break;
    }
    $$('travel-personal').setValue(app.travel_personal === 'Y');
    $$('travel-friend').setValue(app.travel_friend === 'Y');
    $$('travel-public').setValue(app.travel_public === 'Y');
    $$('travel-unknown').setValue(app.travel_unknown === 'Y');
    $$('day-shift').setValue(app.day_shift === 'Y');
    $$('night-shift').setValue(app.night_shift === 'Y');
    $$('both-shift').setValue(app.day_shift === 'Y' && app.night_shift === 'Y');
    $$('military-veteran').setValue(app.veteran);

    $$('save').onclick(() => {

        switch ($$('years-experience').getValue()) {
            case '0':
                app.years_experience = 0;
                break;
            case '1':
                app.years_experience = 1;
                break;
            case '3':
                app.years_experience = 3;
                break;
            case '5':
                app.years_experience = 5;
                break;
            default:
                app.years_experience = null;
                break;
        }
        app.travel_personal = $$('travel-personal').getValue() ? 'Y' : 'N';
        app.travel_friend = $$('travel-friend').getValue() ? 'Y' : 'N';
        app.travel_public = $$('travel-public').getValue() ? 'Y' : 'N';
        app.travel_unknown = $$('travel-unknown').getValue() ? 'Y' : 'N';
        app.day_shift = $$('day-shift').getValue() || $$('both-shift').getValue() ? 'Y' : 'N';
        app.night_shift = $$('night-shift').getValue() || $$('both-shift').getValue() ? 'Y' : 'N';
        app.veteran = $$('military-veteran').getValue();

        Server.call(Framework.REST, 'SaveApplication', app).then(async res => {
            if (res._Success) {
                await Framework.chkPerson(res, app);
            }
        });
    });

    $$('cancel').onclick(() => {
        Utils.popPage();
    });

})();
