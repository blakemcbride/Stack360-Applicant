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

    let offer;

    $('#company-name').text(GlobalData.CompanyNameMedium);

    $$('accept').onclick(async () => {
        $$('ap-date').setValue(new Date());
        $$('ap-signature').clear();
        Utils.popup_open('accept-popup', 'ap-signature');

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });

        $$('ap-accept').onclick(async () => {
            const data = {
                applicationId: offer.applicationId,
                signature: $$('ap-signature').getValue()
            }
            let res = await Server.call(Framework.REST, 'AcceptOffer', data);
            if (res._Success) {
                await Utils.showMessage("Status", "Offer Accepted.  Thank you.  Someone will be in touch with you shortly.");
                Framework.logout();
            }
        });

    });

    $$('decline').onclick(async () => {
        Utils.yesNo('Query', 'Are you sure you want to decline this offer?', async () => {
            const data = {
                applicationId: offer.applicationId
            }
            let res = await Server.call(Framework.REST, 'RejectOffer', data);
            if (res._Success) {
                await Utils.showMessage("Status", "Offer Rejected.  Please apply again when you like.");
                Framework.logout();
            }
        });
    });

    $$('logout').onclick(Framework.logout);

    // This should come at the end so that if there is an error in the service, 'logout' still works
    offer  = await Server.call(Framework.REST, 'GetOffer');
    if (!offer._Success) {
        $$('accept').onclick(null);
        $$('decline').onclick(null);
    } else
        $('#offer').html(offer.offerHtml);


})();
