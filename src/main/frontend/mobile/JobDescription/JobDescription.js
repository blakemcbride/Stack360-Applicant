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

    $('#company-name').text(GlobalData.CompanyNameMedium);

    $$('apply').onclick(() => {
        Utils.pushPage('mobile/Apply/Apply');
    });

    $$('back').onclick(() => {
        Utils.popPage();
    });

    Utils.waitMessage("Fetching Job Description.");

    const jobInfo = Utils.getData('jobInfo');
    const data = {
        applicant_position_id: jobInfo.applicant_position_id
    };
    Server.call(Framework.REST, 'GetJobDescription', data).then(res => {
        Utils.waitMessageEnd();
        if (res._Success) {
            $$('job-description').setHTMLValue(res.job_description);
        }
    });

})();
