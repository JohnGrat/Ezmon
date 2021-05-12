var state = {
    YourCustomer: { name: "YourCustomer", colour: "UNKOWN" },
}

var myAudio = new Audio(chrome.runtime.getURL("sounds/ping.mp3"));

const colours = {
    GREEN: { name: "GREEN", icon: "icons/status_green16x16.png" },
    YELLOW: { name: "YELLOW", icon: "icons/status_yellow16x16.png" },
    BLACK:  { name: "BLACK", icon: "icons/status_black16x16.png" },
    RED: { name: "RED", icon: "icons/status_red16x16.png" },
    UNKOWN: { name: "UNKOWN", icon: "icons/status_unkown16x16.png" }
 }



const icons_green = ["zetup_bigwithack_ack.png",  "zetup_bigwithack_critical_ack.png",  "zetup_bigwithack_critical_dt.png",  "zetup_bigwithack_downtime.png",  "zetup_bigwithack_down_ack.png",  "zetup_bigwithack_down_dt.png",  "zetup_bigwithack_ok.png",  "zetup_bigwithack_ok_dt.png",  "zetup_bigwithack_sack.png",  "zetup_bigwithack_sdowntime.png",  "zetup_bigwithack_unknown_ack.png",  "zetup_bigwithack_unknown_dt.png",  "zetup_bigwithack_unreachable_ack.png",  "zetup_bigwithack_unreachable_dt.png",  "zetup_bigwithack_up.png",  "zetup_bigwithack_up_dt.png",  "zetup_bigwithack_warning_ack.png",  "zetup_bigwithack_warning_dt.png",  "zetup_big_ack.png",  "zetup_big_critical_ack.png",  "zetup_big_critical_dt.png",  "zetup_big_downtime.png",  "zetup_big_down_ack.png",  "zetup_big_down_dt.png",  "zetup_big_ok.png",  "zetup_big_ok_dt.png",  "zetup_big_sack.png",  "zetup_big_sdowntime.png",  "zetup_big_unknown_ack.png",  "zetup_big_unknown_dt.png",  "zetup_big_unreachable_ack.png",  "zetup_big_unreachable_dt.png",  "zetup_big_up.png",  "zetup_big_up_dt.png",  "zetup_big_warning_ack.png",  "zetup_big_warning_dt.png"]
const icons_red = ["zetup_big_critical.png", "zetup_big_down.png", "zetup_bigwithack_critical.png", "zetup_bigwithack_down.png"];
const icons_black = ["zetup_bigwithack_error.png",  "zetup_bigwithack_pending.png",  "zetup_bigwithack_unchecked.png",  "zetup_bigwithack_unknown.png",  "zetup_bigwithack_unreachable.png",  "zetup_big_error.png",  "zetup_big_pending.png",  "zetup_big_unchecked.png",  "zetup_big_unknown.png",  "zetup_big_unreachable.png"];
const icons_yellow = ["zetup_big_warning.png", "zetup_bigwithack_warning.png"];


let enabledSites= [];


var current = colours.UNKOWN



// Get the enabled sites
extensionApi.storage.sync.get({
    sites: {}
  }, function (items) {
    enabledSites = Object.values(items.sites);
  });

function setDefaultOptions () {
    extensionApi.storage.sync.set({
      sites: defaultSites
    }, function () {
      extensionApi.runtime.openOptionsPage();
    });
  }


extensionApi.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
      setDefaultOptions();
    } else if (details.reason === 'update') {

    }
  });


function setColour(colour) {

    const {icon} = colour

    if (current.icon != icon){

        if(current.name === "GREEN"){
             myAudio.play();
        }
        
        var x = 0;
        var intervalID = setInterval(function() {
    
             chrome.browserAction.setIcon({ path: current.icon });
    
             setTimeout(() => {
                 chrome.browserAction.setIcon({ path: icon });
             }, 400);
    
             if (++x === 5) {
                 chrome.browserAction.setIcon({ path: icon  });
                 window.clearInterval(intervalID);
                 current = colour;
             }
         }, 1000);
    }
}

update()
setInterval(() => {
    update()
}, 90000);


async function update() {

    var array = [];
    const json = await resolvePromise('http://yourserver/nagvis/server/core/ajax_handler.php?mod=Map&act=getObjectStates&show=Zmon&ty=state')

    if (json){
          
        json.forEach(element => {

            const { members: [ { name: name }  ], icon: icon } = element

            if (enabledSites.includes(name)){

                var colour = "UNKOWN"

                if (icons_green.includes(icon)) { colour = "GREEN" } 
                else if (icons_red.includes(icon)) { colour = "RED" } 
                else if (icons_yellow.includes(icon)) { colour = "YELLOW" } 
                else if (icons_black.includes(icon)) { colour = "BLACK" } 
                else { console.log("%s is a unkown icon", icon) }

                array.push(new Object ({ name: name, colour: colour }))

            }
        });
       

        if (array.some(x => x.colour == "RED") ) { setColour(colours.RED) }
        else if(array.some(x => x.colour == "BLACK" )) { setColour(colours.BLACK)  }
        else if(array.some(x => x.colour == "YELLOW")) { setColour(colours.YELLOW)  }
        else if(array.some(x => x.colour == "GREEN")) { setColour(colours.GREEN)  }
        else { setColour(colours.UNKOWN) }
        

        Object.keys(state).forEach(element => {
            array.forEach(item => {
                if (state[element].name == item.name && state[element].colour != item.colour) {
                    
                        var time = new Date();
                        var stringtime = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false })
                        console.log("%s %s has changed from %s to %s", stringtime, state[element].name, state[element].colour, item.colour) 
                        state[element].colour = item.colour
                }
            });

        })
    }
    else { setColour(colours.UNKOWN) }
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