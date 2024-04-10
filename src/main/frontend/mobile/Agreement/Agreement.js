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

     $('#company-name').text(GlobalData.CompanyName);
     $('agreement-text').html(GlobalData.CompanyNameLong +` retains the right to verify all information provided by me. In the process of
            such verification, I fully authorize ` + GlobalData.CompanyNameLong + ` to contact any person, school,
            organization, or employer listed to disclose all information necessary to verify information or statements. I
            release all persons who disclose such information from any liability or damages to me or anyone acting in my
            name. I waive any written notice of the release of such information that may be required by any state or federal
            law. Any falsification, misrepresentation, or omission, whenever discovered, shall be considered legitimate and
            sufficient grounds for dismissal. If hired, my employment with ` + GlobalData.CompanyNameLong + ` is at-will.
            This means that I may terminate my employment at any time. Similarly, the company may terminate my
            employment at any time, with or without cause.
            <p>
                By applying for a position, you are authorizing ` + GlobalData.CompanyNameLong + ` to perform
                a background check on you prior to your employment.
            </p>`);

    if (app.agrees === 'Y') {
        $$('agrees').setValue(true).disable();
        $$('agreement-name').setValue(app.agreement_name).disable();
        $$('agreement-date').setValue(app.agreement_date);
        $$('accept').hide();
        $$('cancel').setValue('Back');
    } else {
        $$('agrees').clear().enable();
        $$('agreement-name').clear().enable();
        $$("agreement-date").setValue(new Date());
        $$('accept').show();
        $$('cancel').setValue('Cancel');
    }

    $$('accept').onclick(() => {
        if (!$$('agrees').getValue()) {
            Utils.showMessage('Error', 'You must accept the terms in order to continue.');
            return;
        }
        if ($$('agreement-name').isError('Your name'))
            return;
        app.agrees = 'Y';
        app.agreement_name = $$('agreement-name').getValue();
        app.agreement_date = $$('agreement-date').getDateValue();
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
