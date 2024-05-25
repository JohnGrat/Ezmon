

const colours = {
    GREEN: {  icon: "../icons/status_green16x16.png", icon2: "../icons/status_green32x32.png" },
    YELLOW: { icon: "../icons/status_yellow16x16.png", icon2: "../icons/status_yellow32x32.png" },
    BLACK: { icon: "../icons/status_black16x16.png",  icon2: "../icons/status_black32x32.png" },
    RED: { icon: "../icons/status_red16x16.png", icon2: "../icons/status_red32x32.png" },
    UNKNOWN: { icon: "../icons/status_unkown16x16.png", icon2: "../icons/status_unkown16x16.png" }
}

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

let enabledSites = {};
let server = 'https://server/nagvis/server/core/ajax_handler.php?mod=Map&act=getObjectStates&show=ezmon&ty=state';

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "WAKE_UP") {
      // Handle the message here
      sendResponse({farewell: "goodmorning"});
    }
  });

// Get the enabled sites
chrome.storage.sync.get({
    enabledSites: {}
}, function (items) {
    enabledSites = Object.values(items.enabledSites);
});

function setDefaultOptions() {
    chrome.storage.sync.set({
        enabledSites: enabledSites
    }, async function () {
        await update()
        chrome.runtime.openOptionsPage();
    });
}


chrome.runtime.onInstalled.addListener(function (details) {
    chrome.storage.local.set({current: "UNKNOWN"}, function() {
            console.log('The initial state is set to "UNKNOWN".');
    });
    setColour("UNKNOWN")
    if (details.reason === 'install') {
        setDefaultOptions();
    } else if (details.reason === 'update') {

    }
});



function setColour(colour) {

    chrome.storage.local.get(['current'], function(result) {
        current = result.current

    var newIcon = colours[colour].icon;
    var currentIcon = colours[current].icon;

    if (current === colour) {
        return;
    }

    chrome.storage.local.set({current: colour}, function() {

    });

    if (current === "UNKNOWN" || colour === "GREEN") {
        chrome.action.setIcon({ path: newIcon });
        current = colour;
        return;
    }

    

    if (current === "GREEN") {
          chrome.storage.sync.get({
        data: {},
    }, function (items) {
   

       let message = '';
    for (let key in items.data.maps) {
        if (items.data.maps.hasOwnProperty(key)) {
            let item = items.data.maps[key];
            if (item.summary_state !== 'UP' && item.summary_state !== 'OK') {
                message += `${key} is ${item.summary_state}.\n`;
            }
        }
    }

        chrome.notifications.create({
        type: 'basic',
        iconUrl:  colours[colour].icon2,
        title: `Server`,
        message: message,
        priority: 1
        });
         });
    }
     

    var x = 0;
    var intervalID = setInterval(function () {
        chrome.action.setIcon({ path: currentIcon });
        setTimeout(() => {
            chrome.action.setIcon({ path: newIcon });
        }, 400);
        if (++x === 5) {
            chrome.action.setIcon({ path: newIcon });
            clearInterval(intervalID);
        }
    }, 1000);
    });
}

update()
setInterval(() => {
    update()
}, 90000);



function handleResponse(message) {
    setColour("UNKNOWN");
    var response = { message: message };
    chrome.storage.sync.set({ response: response, data: {} }, function () {
        console.log('Data is saved in sync storage');
        chrome.runtime.sendMessage({type: "dataSaved"})
    });
}

async function update() {
    const json = await resolvePromise(server, { mode: 'no-cors' });

    if (!json) {
        handleResponse("Connection to Server failed. Please verify your VPN connection.");
        return;
    } else if (json.message == "LogonMultisite: Not authenticated.") {
        handleResponse("Authentication failed. Please log in at server");
        return;
    } else if (json.message == "You are not permitted to access this page (Map/view/ezmon).") {
        handleResponse("Access denied. You don't have permission to access the NavGIS map. Please contact your CheckMK administrator.");
        return;
    } else if (json.type == "error") {
        handleResponse(`An error occurred: ${json.message}`);
        return;
    } else {
        chrome.storage.sync.set({ response: "" }, function () {
           
        });
    }

    const sites = parseSites(json[0].members);
    const data = filterSites(sites);

    chrome.storage.sync.set({sites: sites, data: data}, function() {
        console.log('Data is saved in sync storage');
       chrome.runtime.sendMessage({type: "dataSaved" }, function(response) {
    if (chrome.runtime.lastError) {
        // Handle error here
        console.log(chrome.runtime.lastError.message);
    } else {
        // Handle response here
    }
});
    });


    setColourBasedOnObject(data.maps);
    //updateState(sites);
}

function parseSites(members) {
    let sites = {maps :  {} , services : {} };

    members.forEach(element => {
        var site = {name: element.name, display_name: element.display_name, summary_state: element.summary_state};

        if(element.summary_in_downtime == 1 || element.summary_problem_has_been_acknowledged == 1){
            site.summary_state = "UP"
        }
        if (element.type === 'map' && element.name.startsWith('map_')) {
            sites.maps[element.display_name] = site;
        } else {
            sites.services[element.display_name] = site;
        }
    });

    return sites;
}

function filterSites(sites) {
    let {maps, services} = sites;

     if(Object.keys(enabledSites).length > 0) {
    maps = Object.fromEntries(Object.entries(maps).filter(([key, element]) => {
        return enabledSites.some(site => element.name.includes(site));
    }));
}   

    services = Object.fromEntries(Object.entries(services).filter(([key, element]) => {
        return enabledSites.some(site => element.name.includes(site));
    }));

    return {maps, services};
}

function setColourBasedOnObject(obj) {
    let values = Object.values(obj);
    if (values.some(x => x.summary_state == 'DOWN' || x.summary_state == 'CRITICAL')) {
        setColour("RED");
    } else if (values.some(x => x.summary_state == "UNREACHABLE" || x.summary_state == "UNKNOWN")) {
        setColour("BLACK");
    } else if (values.some(x => x.summary_state == "WARNING")) {
        setColour("YELLOW");
    } else if (values.some(x => x.summary_state == "OK" || x.summary_state == "UP")) {
        setColour("GREEN");
    } else {
        setColour("UNKNOWN"); // Fixed the typo here
    }
}

function updateState(array) {
    Object.keys(state).forEach(element => {
        array.forEach(item => {
            if (state[element].name == item.name && state[element].colour != item.colour) {
                const time = new Date();
                const stringtime = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false });
                console.log("%s %s has changed from %s to %s", stringtime, state[element].name, state[element].colour, item.colour);
                state[element].colour = item.colour;
            }
        });
    });
}

async function resolvePromise(url) {
    const headers = new Headers({
        "Access-Control-Allow-Origin": "*",
        "Accept": "application/json",
        "Content-Type": "application/json"
    });
    try {
        const res = await fetch(url, {
            method: "GET",
            headers: headers
        });
        const json = await res.json(); // eller .text();
        return json;
    } catch (ex) {
        console.log(ex);
    }
    return null;
}