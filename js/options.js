
// Shortcut for document.querySelector()
function $(sel, el = document) {
    return el.querySelector(sel);
  }
  
  // Shortcut for document.querySelectorAll()
  function $$(sel, el = document) {
    return Array.from(el.querySelectorAll(sel));
  }
  
  // Select UI pane
  function selectPane(e) {
    const panes = $$('.pane');
    for (const tab of $$('#tabs button')) {
      tab.classList.toggle('active', tab == e.target);
    }
  
    for (const pane of panes) {
      pane.classList.toggle('active', pane.id == e.target.dataset.pane);
    }
  }
  
  // Saves options to extensionApi.storage
  function saveOptions () {


    const enabledSites = $$('#bypass_sites input').reduce(function (memo, inputEl) {
      if (inputEl.checked) {
        memo[inputEl.dataset.key] = inputEl.dataset.value;
      }
      return memo;
    }, {});

  
    extensionApi.storage.sync.set({
      enabledSites: enabledSites,
      data : {}
    }, function () {
      // Update status to let user know options were saved.
      const status = $('#status');
      status.textContent = 'Options saved';
      setTimeout(function () {
        status.textContent = '';
  
        // Reload runtime so background script picks up changes
        chrome.runtime.reload();
  
        window.close();
      }, 800);
    });
  }
  
  // Restores checkbox input states using the preferences
  // stored in extensionApi.storage.
function renderOptions () {
    extensionApi.storage.sync.get({
      enabledSites: {},
    }, function (items) {
      // Render supported sites
      const sites = items.enabledSites;

      chrome.storage.sync.get('sites', function(result) {
        
        // Check if result.sites and result.sites.maps are not undefined
        if(result.sites && result.sites.maps){

          var defaultSites = result.sites.maps;

          for (const key in defaultSites) {
            if (!Object.prototype.hasOwnProperty.call(defaultSites, key)) {
              continue;
            }

            // Check if an element with the same key already exists
            if (document.querySelector(`input[data-key="${key}"]`)) {
              continue;
            }

            const value = defaultSites[key].name;
            const labelEl = document.createElement('label');
            const inputEl = document.createElement('input');
            inputEl.type = 'checkbox';
            inputEl.dataset.key = key;
            inputEl.dataset.value = value;
            inputEl.checked = (key in sites) || (key.replace(/\s\(.*\)/, '') in sites);

            labelEl.appendChild(inputEl);
            labelEl.appendChild(document.createTextNode(key));
            $('#bypass_sites').appendChild(labelEl);
          }

          // Set select all/none checkbox state
          const nItems = $$('input[data-key]').length;
          const nChecked = $$('input[data-key]').filter(el => el.checked).length;
          $('#select-all input').checked = nChecked / nItems > 0.5;
          $('#select-all input').indeterminate = nChecked && nChecked != nItems;
        }

        else {
          // Check if local storage contains Response and display it
                    chrome.storage.sync.get(['response'], function(result) {
        // Check if there is a message saved in storage
                if (result.response) {
                    // Select the status message div and update its content
                    var statusMessageDiv = document.getElementById('status-message');
                    statusMessageDiv.textContent = result.response.message;
                }
            }); 
        }
      });
       
    });
}
  // Select/deselect all supported sites
  function selectAll () {
    for (const el of $$('input[data-key]')) {
      renderOptions ()
      el.checked = this.checked;
    };
  }
  
  // Initialize UI
  function init() {
    renderOptions();
  
    $('#save').addEventListener('click', saveOptions);
    $('#select-all input').addEventListener('click', selectAll);
  
    for (const el of $$('#tabs button')) {
      el.addEventListener('click', selectPane);
    }
  
    selectPane({target: $('#tabs button:first-child')});
  
    if (extensionApi === chrome) {
      document.body.classList.add('customSitesEnabled');
    }
  }
  
  document.addEventListener('DOMContentLoaded', init);

