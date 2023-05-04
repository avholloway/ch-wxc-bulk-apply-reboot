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

const find_phone_props = (element) => {
    const props = $(element)[0].__ngContext__;
    for (let i = 0, j = props.length; i < j; i++) {
        if (props[i] && typeof props[i] === 'object' && 'deviceType' in props[i]) {
            return props[i];
        }
    }
}

const is_ipphone = phone => phone.deviceType === 'ipphone';

const is_checked = element => $('input[type="checkbox"]', $(element))[0].checked;

const get_selected_phones = () => {
    const phones = [];
    $('p-tablecheckbox').each(function(index) {
        const phone = find_phone_props(this);
        if (is_ipphone(phone) && is_checked(this))
            phones.push(phone);
    });
    return phones;
}

const hide_status = () => {
    $('div#my-custom-status').remove();
}

const show_status = (message) => {
    const html = `
        <div dir="ltr" id="my-custom-status">
            <div id="cdk-overlay-0" class="cdk-overlay-pane">
                <md-alert-container role="alert" class="md-alert__container md-alert__container--bottom-right">
                    <md-alert role="alert" _nghost-pnv-c103="" aria-label="success" class="md-alert md-alert--success">
                        <div _ngcontent-pnv-c103="" aria-hidden="true" class="md-alert__icon"></div>
                        \x3C!---->
                        <div _ngcontent-pnv-c103="" aria-live="polite" class="md-alert__content">
                            <h3 _ngcontent-pnv-c103="" class="md-alert__title"></h3>
                            <div _ngcontent-pnv-c103="" class="md-alert__messages">
                                <div _ngcontent-pnv-c103="" class="md-alert__message">${message}</div>
                                \x3C!---->\x3C!---->\x3C!---->\x3C!---->\x3C!---->
                            </div>
                            \x3C!---->
                        </div>
                        <div _ngcontent-pnv-c103="" class="md-alert__button">
                            <md-icon _ngcontent-pnv-c103="" name="cancel" clickable="true" style="display: inline-flex;" aria-labelledby="">
                                <button mdbutton="" class="md-button md-button--32 md-button--icon" aria-label="Close" active="false" href="" tabindex="0" type="button">
                                    \x3C!----><span class="md-button__children" style="opacity: 1;"><i class="icon icon-cancel_16 md-icon" style="color: inherit;"></i></span>
                                </button>
                                \x3C!---->
                            </md-icon>
                        </div>
                        \x3C!---->
                    </md-alert>
                    \x3C!---->
                </md-alert-container>
            </div>
        </div>
    `;
    $(html).insertBefore('div#walkme-dummy-last-element');
    $('div#my-custom-status md-icon').click(function() { hide_status() });
}

const do_apply_config = () => {
    const phones = get_selected_phones();
    show_status(`Apply Config command will be sent to ${phones.length} phones`);
    for (const phone of phones) {
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

const do_reboot_phones = () => {
    const phones = get_selected_phones();
    show_status(`Reboot command will be sent to ${phones.length} phones`);
    for (const phone of phones) {
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
