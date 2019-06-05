'use strict';
const util = require('util');
const puppeteer = require('puppeteer');

// Timezone Offset, HKT +8:00
const HK_TIMEZONE = (8 * 60 * 60 * 1000);
const UTC_TODAY_DATETIME = new Date(new Date().setHours(0, 0, 0, 0));
const LOCAL_TODAY_DATETIME = new Date(+UTC_TODAY_DATETIME.getTime() + HK_TIMEZONE);
// Date for RTHK Traffic News Query, i.e. YYYYmmdd
const LOCAL_TODAY_DATE = util.format('%s%s%s', LOCAL_TODAY_DATETIME.getFullYear().toString(), ('0' + (LOCAL_TODAY_DATETIME.getMonth() + 1)).slice(-2), ('0' + LOCAL_TODAY_DATETIME.getDate()).slice(-2));
// Define the Traffic News URL
const RTHK_TRAFFIC_NEWS_URL = 'https://programme.rthk.hk/channel/radio/trafficnews/index.php';

(async() => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage(); 
    await page.goto(util.format('%s?d=%s', RTHK_TRAFFIC_NEWS_URL, LOCAL_TODAY_DATE));
    // Wait For .articles Loaded
    await page.waitForSelector('.articles');
    // Define the Items Array
    let items = [];  
    let divArticles = await page.$('.articles');
    if(divArticles != null) {
        let ulItems = await divArticles.$$('ul.dec');
        if(ulItems.length > 0) {
            for(let ulItem of ulItems) {
                let newsString = await page.evaluate(el => el.innerText, ulItem);
                // Remove \n from News String
                newsString = newsString.replace('\n', '');
                let dateString = '';
                // Find Date Element and Extract the Date
                let dateItem = await ulItem.$('.date');
                if(dateItem != null) {
                    dateString = await page.evaluate(el => el.innerText, dateItem);
                }
                // If Date String was not empty, tried to find the Date Text from the News String and remove it
                if(dateString != '') {
                    newsString = newsString.replace(dateString, '');
                    // Convert Date String to UTC Date Object
                    // Remove the "HKT" if Exist
                    dateString = dateString.replace('HKT', '');
                    let dateObj = new Date(dateString);
                    // Fix back to HKT Timezone
                    dateObj.setTime(dateObj.getTime() + dateObj.getTimezoneOffset() * 60 * 1000 + HK_TIMEZONE);
                    dateString = dateObj.toISOString();
                }
                items.push({
                    news: newsString,
                    date: dateString
                });
            }
        }
    }
    await browser.close();
    console.log(JSON.stringify(items, null, 2));
})();