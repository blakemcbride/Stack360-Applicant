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
 * Date: 3/10/23
 */

'use strict';

(function () {

    const app = Utils.getData("application");
    const answers = app.answers;
    const jobInfo = Utils.getData('jobInfo');
    const ques = jobInfo.questions;

    $('#company-name').text(GlobalData.CompanyNameMedium);

    let tag = "questions";
    let html;
    for (let i=0 ; i < ques.length ; i++) {
        let q = ques[i];
        let a = null;
        if (answers)
            for (let j=0 ; j < answers.length ; j++)
                if (answers[j].applicant_question_id === q.applicant_question_id) {
                    a = answers[j];
                    break;
                }
        tag = Utils.appendChild(tag, '<div style="">' + q.question + '</div>');
        switch (q.data_type) {
            case 'L':  // list
                html = '<select id="q' + i + '" class="row-spacing">';
                let choices = q.choices;
                html += '<option value="">(choose)</option>';
                for (let i=0 ; i < choices.length ; i++)
                    html += '<option value="' + choices[i].applicant_question_choice_id + '">' + choices[i].description + '</option>';
                html += '</select>';
                tag = Utils.appendChild(tag, html);
                if (a)
                    $('#q'+i).val(a.applicant_question_choice_id);
                break;
            case 'N':  // numeric
                html = '<input type="number" id="q' + i + '" style="width: 120px;" class="row-spacing">'
                tag = Utils.appendChild(tag, html);
                if (a)
                    $('#q'+i).val(a.numeric_answer);
                break;
            case 'D':  // date
                html = '<input type="date" id="q' + i + '" class="row-spacing">'
                tag = Utils.appendChild(tag, html);
                if (a)
                    $('#q'+i).val(DateUtils.intToSQL(a.date_answer));
                break;
            case 'S': // string
                html = '<input type="text" id="q' + i + '" class="row-spacing">'
                tag = Utils.appendChild(tag, html);
                if (a)
                    $('#q'+i).val(a.string_answer);
                break;
            case 'Y': // yes/no
                html = '<div class="row-spacing">';
                html += '<input type="radio" name="q' + i + '" value="Y">'
                html += '<label for="q' + i + '">Yes</label>';
                html += '<input type="radio" name="q' + i + '" value="N" style="margin-left: 20px;">'
                html += '<label for="q' + i + '">No</label>';
                html += '</div>';
                tag = Utils.appendChild(tag, html);
                if (a)
                    $('input[type=radio][name="q' + i + '"][value="'+a.string_answer+'"]').prop('checked', true);
                break;
        }
    }

    $$('save').onclick(() => {
        const ansArray = [];
        for (let i=0 ; i < ques.length ; i++) {
            let q = ques[i];
            let val;
            switch (q.data_type) {
                case 'N':  // numeric
                    ansArray.push({
                        applicant_question_id: q.applicant_question_id,
                        data_type: q.data_type,
                        numeric_answer: Number($('#q'+i).val())
                    });
                    break;
                case 'D':  // date
                    ansArray.push({
                        applicant_question_id: q.applicant_question_id,
                        data_type: q.data_type,
                        date_answer: DateUtils.strToInt($('#q'+i).val())
                    });
                    break;
                case 'S': // string
                    ansArray.push({
                        applicant_question_id: q.applicant_question_id,
                        data_type: q.data_type,
                        string_answer: $('#q'+i).val()
                    });
                    break;
                case 'Y':
                    ansArray.push({
                        applicant_question_id: q.applicant_question_id,
                        data_type: q.data_type,
                        string_answer: $('input[type=radio][name="q' + i + '"]:checked').val()
                    });
                    break;
                case 'L':  // list
                    ansArray.push({
                        applicant_question_id: q.applicant_question_id,
                        data_type: q.data_type,
                        applicant_question_choice_id: $('#q'+i).val()
                    });
                    break;
            }
        }
        app.answers = ansArray;
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
