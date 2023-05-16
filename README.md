# ch-wxc-bulk-apply-reboot
This is a [TamperMonkey](https://www.tampermonkey.net/) User Script for Bulk Apply Config and Reboot of MPP Phones in Webex Calling.

* Apply Config Demo: https://app.vidcast.io/share/5847f82c-bf09-4880-a86a-7dd889ffd223
* Reboot Phones Demo: https://app.vidcast.io/share/f0f3a205-622b-4a17-912d-7e9bcf9e7ff3

# Installing
First you will need a User Script Manager, such as TamperMonkey, installed in your browser.  Next, depending on which manager you installed, follow their instructions for [importing or installing a new user script](https://www.tampermonkey.net/faq.php#Q102), which you can find in this repository, with the file name ending in "user.js".

# Using
Simply visit the Control Hub device search page, and check the box next to one or more MPP phones, the bulk action bar will appear, and if all goes well, you will see two new actions: Reboot Phones and Apply Config.  Note that the script will check for device types, and filter out any devices you've selected which are not MPP phones (e.g., RoomOS devices).  Also, I have not built any confirmation pop-up yet (or I may never), so your confirmation would be to refresh the device search page after a few seconds, and see that your devices are offline.

# Disclaimer
This example is only a sample and is NOT guaranteed to be bug free and production quality.

The example code is meant to:
* Illustrate how to use the User Scripts to enhance your Control Hub experience.
* Work with both documented and undocumented APIs.

# Support Notice
There is no support for this solution.
