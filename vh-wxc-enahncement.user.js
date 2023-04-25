// ==UserScript==
// @name         Webex Calling - MPP Apply Config
// @namespace    https://avholloway.com/
// @version      0.1
// @description  Trying to add an Apply Config feature to the Device > Search page
// @author       Anthony Holloway
// @match        https://admin.webex.com/*
// @require      https://code.jquery.com/jquery-3.6.4.min.js
// @require      https://gist.githubusercontent.com/BrockA/2625891/raw/waitForKeyElements.js
// @run-at       document-end
// @grant        unsafeWindow
// @grant        window.onurlchange
// @grant        GM_xmlhttpRequest
// ==/UserScript==

let access_token = '', org_id = '';

(function() {
    'use strict';
    if (window.onurlchange === null) {
        window.addEventListener('urlchange', e => {
            if (e.url === 'https://admin.webex.com/devices/search') {
                device_search_page();
            }
        });
    }
})();

const device_search_page = () => {
    access_token = unsafeWindow.sessionStorage.accessToken;
    org_id = unsafeWindow.sessionStorage.userOrgId; // `ciscospark://us/ORGANIZATION/${org_id}`
    if (!access_token) return;

    waitForKeyElements('mch-bulk-actions-bar div.action-container button[aria-label="Edit"]', element => {
        if ($('my-custom-apply-config-button').length > 0) return false;

        const insertion_point = element.parent().parent();

        // Apply Config Button
        const apply_config_button = element.parent().clone();
        insertion_point.prepend(apply_config_button);

        $('button', apply_config_button)
            .attr({
                'id': 'my-custom-apply-config-button',
                'aria-label': 'Apply Config',
                disabled: false,
            })
            .removeClass('md-button--disabled');
        $('md-icon', apply_config_button).removeClass('icon-edit_14').addClass('icon-deskphone_14');
        $('span span', apply_config_button).text('Apply Config');
        apply_config_button.click(do_apply_config);

        // Reboot Phones Button
        const reboot_phones_button = element.parent().clone();
        insertion_point.prepend(reboot_phones_button);
        $('button', reboot_phones_button)
            .attr({
                'id': 'my-custom-reboot-phones-button',
                'aria-label': 'Reboot Phones',
                disabled: false,
            })
            .removeClass('md-button--disabled');
        $('md-icon', reboot_phones_button).removeClass('icon-edit_14').addClass('icon-deskphone_14');
        $('span span', reboot_phones_button).text('Reboot Phones');
        reboot_phones_button.click(do_reboot_phones);

        return false;
    }, true);
}

const do_apply_config = () => {
    $('p-tablecheckbox').each(function(index) {
        const phone = $(this)[0].__ngContext__[26] || {};
        if (phone.deviceType === 'ipphone') {
            const checkbox = $('input[type="checkbox"]', $(this))[0];
            if (checkbox.checked) {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `https://webexapis.com/v1/telephony/config/devices/${phone.deviceId}/actions/applyChanges/invoke`,
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    },
                    onload: function(response) {
                        console.log('Apply Config:', phone.displayName, phone.deviceId, response.status);
                    },
                    onerror: function(response) {
                        console.log('Apply Config:', phone.displayName, phone.deviceId, response.status, response.responseText);
                    }
                });
            }
        }
    });
}

const do_reboot_phones = () => {
    $('p-tablecheckbox').each(function(index) {
        const phone = $(this)[0].__ngContext__[26] || {};
        if (phone.deviceType === 'ipphone') {
            const checkbox = $('input[type="checkbox"]', $(this))[0];
            if (checkbox.checked) {
                const device_id = phone.wdmUrl.split('\/').pop();
                const encoded_device_id = btoa(`ciscospark://urn:TEAM:us-west-2_r/DEVICE/${device_id}`);
                const payload = {
                    deviceId: encoded_device_id,
                    arguments: {
                        'Force': 'False'
                    }
                }
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `https://xapi-r.wbx2.com/xapi/api/xapi/command/SystemUnit.Boot`,
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(payload),
                    onload: function(response) {
                        console.log('Reboot Phone:', phone.displayName, device_id, response.status, response.responseText);
                    },
                    onerror: function(response) {
                        console.log('Reboot Phone:', phone.displayName, device_id, response.status, response.responseText);
                    }
                });
            }
        }
    });
}
