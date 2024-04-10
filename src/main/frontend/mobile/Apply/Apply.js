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

    const app = await Server.call(Framework.REST, 'GetApplication');
    if (!app._Success) {
        Utils.popPage(null, 2);
        return;
    }
    delete app._ErrorCode;
    delete app._Success;
    app.browserInfo = navigator.userAgent;
    Utils.saveData('application', app);
    const answers = app.answers;
    const jobInfo = Utils.getData('jobInfo');
    const ques = jobInfo.questions;

    /**
     * Returns true if all the question have been answered.
     * If not, false is returned meaning they haven't answered all the questions.
     */
    function checkAnswers() {
        for (let i=0 ; i < ques.length ; i++) {
            let q = ques[i];
            let found = false;
            for (let j=0 ; j < answers.length ; j++) {
                let a = answers[j];
                if (q.applicant_question_id === a.applicant_question_id) {
                    switch (q.data_type) {
                        case "L":
                            if (!a.applicant_question_choice_id)
                                return false;
                            break;
                        case 'S':
                        case 'Y':
                            if (!a.string_answer)
                                return false;
                            break;
                        case 'N':
                        case 'D':
                            break;  //  allow zero
                    }
                    found = true;
                }
                let x = 1;
            }
            if (!found)
                return false;  // not answered;
            /*
            ansArray.push({
                applicant_question_id: q.applicant_question_id,
                data_type: q.data_type,
                answer: val
            });

             */
        }
        return true;  //  all questions have been answered
    }

    $$('personal-information-cb').setValue(
        hasStrData(app.fname) &&
        hasStrData(app.lname) &&
        hasStrData(app.street) &&
        hasStrData(app.city) &&
        hasStrData(app.state) &&
        hasStrData(app.zip) &&
        hasStrData(app.personal_email) &&
        hasStrData(app.ssn) &&
        app.dob > 19200101 &&
        hasStrData(app.phone_number) &&
        hasStrData(app.contact_name) &&
        hasStrData(app.relationship) &&
        hasStrData(app.cell_phone)
    );

    $$('questions-cb').setValue(checkAnswers());

    $$('employment-history-cb').setValue(
        app.employment.length > 0
    );

    $$('education-cb').setValue(
        app.education.length > 0
    );

    $$('self-identification-cb').setValue(
        !!app.eeo_race_id &&  !!app.sex
    );

    $$('agreement-cb').setValue(
        app.agrees === 'Y'
    );

    $$('personal-information').onclick(() => {
        Utils.pushPage('mobile/PersonalInformation/PersonalInformation')
    });

    $$('questions').onclick(() => {
        Utils.pushPage('mobile/Questions/Questions')
    });

    $$('employment-history').onclick(() => {
        Utils.pushPage('mobile/EmploymentHistory/EmploymentHistory')
    });

    $$('education').onclick(() => {
        Utils.pushPage('mobile/Education/Education')
    });

    $$('self-identification').onclick(() => {
        Utils.pushPage('mobile/SelfIdentification/SelfIdentification')
    });

    $$('agreement').onclick(() => {
        Utils.pushPage('mobile/Agreement/Agreement')
    });

    $$('document-upload').onclick(() => {
        Utils.pushPage('mobile/DocumentUpload/DocumentUpload')
    });

    $$('submit').onclick(() => {
        if (!$$('personal-information-cb').getValue() ||
            !$$('employment-history-cb').getValue() ||
            !$$('education-cb').getValue() ||
            !$$('self-identification-cb').getValue() ||
            !checkAnswers() ||
            !$$('agreement-cb').getValue()) {
            Utils.showMessage('Error', 'You must first complete all of the above sections before you can submit your application.');
            return;
        }
        app.applicant_position_id = jobInfo.applicant_position_id;
        Server.call(Framework.REST, 'SubmitApplication', app).then(async res => {
            if (res._Success) {
                await Utils.showMessage('Status', 'Thank you!  Your application has been submitted.  You will hear from us soon vie email or phone. You can also periodically check your status through this interface.');
                //Utils.popPage();
                await Utils.showMessage('Status', 'Please take a moment and fill out the following information.');
                AWS.logout();
                window.onbeforeunload = null;  //  allow back button again
                window.location.href = 'https://survey.taxcreditco.com/WTG2023';
            }
        });
    });

    $$('back').onclick(() => {
        Utils.popPage(null, 2);
    });

    function hasStrData(v) {
        return !!(v && v.trim());
    }

})();
