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

(async function () {

    $('#company-name').text(GlobalData.CompanyName);
    $('#company-logo').attr('src', GlobalData.logoFile);
    $('#company-logo').css(GlobalData.logoStyle);

    $('#thank-you').text(`Thank you for your interest in ` + GlobalData.CompanyName + `.  
      The following lists the open positions.  
      Please select the ones you have interest in by clicking on the position and pressing 'Select'.
      After reading the specifics, you will have the opportunity to apply.`);

    let res = await Server.call(Framework.REST, 'GetPersonStatus');
    if (!res._Success)
        return;


    if (res.isEmloyee) {
        await Utils.showMessage('Status', 'You are already an employee.');
        Framework.logout();
    }
    Utils.saveData("applicationStatus", res.applicationStatus);
    switch (res.applicationStatus) {
        case 1:
            await Utils.showMessage('Status', 'You have already applied. It is currently under consideration. We will contact you shortly via email or phone if an offer is extended.  You can also check your status through this interface.');
            break;
        case 2: // offer extended
            await Utils.showMessage('Status', 'A job offer has been extended.');
            Utils.pushPage('mobile/SignOffer/SignOffer');
            return;
            break;
        case 3:
            await Utils.showMessage('Status', 'You have already accepted our offer.');
            Framework.logout();
            break;
        case 5:
            let ans = await Utils.yesNo('Status', 'You have already declined our offer. Would you like to re-apply?')
            if (!ans)
                Framework.logout();
            break;
        case 6:
            await Utils.showMessage('Status', 'Our offer has expired.  You may re-apply.');
            break;
    }

    Server.call(Framework.REST, 'GetJobs').then(res => {
        if (res._Success) {
            $$('available-positions').addItems(res.jobs, 'applicant_position_id', 'job_title');
            if (res.jobs.length === 1) {
                $$('available-positions').setValue(res.jobs[0].applicant_position_id);
                $$('select').enable();
            }
        }
    });

    $$('available-positions').onChange((val, lbl, data) => {
        $$('select').enable();
    });

    $$('select').onclick(() => {
        Utils.saveData("jobInfo", $$('available-positions').getData());
        Utils.pushPage('mobile/JobDescription/JobDescription');
    });

    $$('logout').onclick(Framework.logout);

})();
