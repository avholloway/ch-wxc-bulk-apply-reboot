// ==UserScript==
// @name         Webex Calling - Bulk MPP Apply Config and Reboot
// @namespace    https://avholloway.com/
// @version      0.1
// @description  Adds Apply Config and Reboot buttons Device > Search page's bulk action bar
// @author       Anthony Holloway
// @match        https://admin.webex.com/*
// @require      https://code.jquery.com/jquery-3.6.4.min.js
// @require      https://gist.githubusercontent.com/BrockA/2625891/raw/waitForKeyElements.js
// @run-at       document-end
// @grant        unsafeWindow
// @grant        window.onurlchange
// @grant        GM_xmlhttpRequest
// ==/UserScript==

let access_token = '';

(function() {
    'use strict';
    console.log('wxc mpp bulk script is loaded');
    if (window.onurlchange === null) {
        window.addEventListener('urlchange', e => {
            console.log('url change detected: ', e.url);
            if (e.url === 'https://admin.webex.com/devices/search') {
                device_search_page();
            }
        });
    }
})();

const device_search_page = () => {
    console.log('user is looking at the device search page');

    access_token = unsafeWindow.sessionStorage.accessToken;
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

        console.log('created apply config and reboot bulk action buttons');

        return false;
    }, true);
}

const do_apply_config = () => {
    console.log('apply config button clicked');
    $('p-tablecheckbox').each(function(index) {
        const phone = $(this)[0].__ngContext__[26] || {};
        if (phone.deviceType === 'ipphone') {
            const checkbox = $('input[type="checkbox"]', $(this))[0];
            if (checkbox.checked) {
                console.log(`resyncing ${phone.displayName}`);
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `https://webexapis.com/v1/telephony/config/devices/${phone.deviceId}/actions/applyChanges/invoke`,
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        }
    });
}

const do_reboot_phones = () => {
    console.log('reboot phones button clicked');
    $('p-tablecheckbox').each(function(index) {
        const phone = $(this)[0].__ngContext__[26] || {};
        if (phone.deviceType === 'ipphone') {
            const checkbox = $('input[type="checkbox"]', $(this))[0];
            if (checkbox.checked) {
                console.log(`rebooting ${phone.displayName}`);
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
                    data: JSON.stringify(payload)
                });
            }
        }
    });
}
