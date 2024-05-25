function init() {

   var statusMessageDiv = document.getElementById('status-message');
    statusMessageDiv.textContent = '';

var oldTable = document.getElementById('data-table'); // Select the existing table

extensionApi.storage.sync.get({
    data: {},
}, function (items) {
    var data = items.data.maps; // Use the data from the items object

    // Define the order of the summary states
    var order = { 'CRITICAL': 1, 'DOWN': 2, 'WARNING': 3, 'UP': 4, 'OK': 5 };



    var newTable = document.createElement('table'); // Create a new table in memory
    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');

    // Create the header row
    var headerRow = document.createElement('tr');
    [' ', ' '].forEach(text => {
        var th = document.createElement('th');
        th.appendChild(document.createTextNode(text));
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    if(items.data.maps !== undefined && items.data.maps !== null && Object.keys(items.data.maps).length !== 0){
    // Convert the data object to an array and sort it
    data = Object.values(data).sort((a, b) => {
        return order[a.summary_state] - order[b.summary_state];
    });

    // Create the body rows
    data.forEach(item => {
    var tr = document.createElement('tr');
    [item.display_name, item.summary_state].forEach((text, index) => {
        var td = document.createElement('td');
        
        if (index === 1) { // Assuming the image is related to the summary_state
            var img = document.createElement('img');
            img.style.display = 'block';

            if(text == 'CRITICAL' || text == 'DOWN'){       
                img.src = '../icons/status_red32x32.png';
            } else if(text == 'WARNING'){
                img.src = '../icons/status_yellow32x32.png';
            } else if(text == 'OK' || text == 'UP'){
                img.src = '../icons/status_green32x32.png';
            } else if(text == 'UNKNOWN' || text == 'UNREACHABLE'){
                img.src = '../icons/status_black32x32.png';
            }

            td.appendChild(img);
        } else {
            td.appendChild(document.createTextNode(text));
        }

        tr.appendChild(td);
    });
    tbody.appendChild(tr);
});
} else {
              chrome.storage.sync.get(['response'], function(result) {
        // Check if there is a message saved in storage
                if (result.response) {
                    // Select the status message div and update its content
                    var statusMessageDiv = document.getElementById('status-message');
                    statusMessageDiv.textContent = result.response.message;
                }
            });
}
    newTable.appendChild(thead);
    newTable.appendChild(tbody);
    
    // Replace the old table with the new one
    oldTable.parentNode.replaceChild(newTable, oldTable);
    newTable.id = 'data-table'; // Assign the id to the new table
});
}

document.addEventListener('DOMContentLoaded', init);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        init()
    }
);

chrome.runtime.sendMessage(
        
        {
          type: "WAKE_UP",
        },
        function (response) {
        });