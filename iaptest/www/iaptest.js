var skuMap = {
  "onetime": {
    "android": "org.chromium.iaptest.onetime"
  },
  "consumable": {
    "android": "org.chromium.iaptest.consumable"
  },
  "nonexistent": {
    "android": "org.chromium.iaptest.nonexistent"
  },
  "unavailable": {
    "android": "org.chromium.iaptest.unavailable"
  }
};

/* Show any initially hidden platform-specific products
 */
if (google.payments.inapp.platform) {
  var platformItems = document.querySelectorAll('.item-group.' + google.payments.inapp.platform);
  for (var i=0; i < platformItems.length; i++) {
    platformItems[i].style.display = "block";
  }
}

/* makeBuyHandler: Returns an event handler which triggers the purchase
 * process for a particular SKU.
 */
var makeBuyHandler = function(sku, consume) {
  return function(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    google.payments.inapp.buy({
      sku: skuMap[sku][google.payments.inapp.platform],
      consume: consume,
      success: function() {
        console.log('success');
        /* Increment the stored value declaring how many of this
         * particular item the user owns.
         */
        chrome.storage.local.get(sku, function(value) {
           var newDict = {};
           var oldValue = value[sku] || 0;
           newDict[sku] = oldValue+1;
           chrome.storage.local.set(newDict);
        });
      },
      failure: function() {
        console.log('failure');
        alert("Fail :(\n\n" + JSON.stringify(arguments));
      }
   });
  };
};

/* Keep track of all of the SKUs so we can query for their details */
var skulist = [];

/* Attach a buyhandler to every item listed */
var items = document.querySelectorAll('.item');
for (var i=0; i < items.length; i++) {
  var sku = items[i].getAttribute('data-sku');
  var consume = (items[i].getAttribute('data-consume') === 'true');
  items[i].addEventListener('click', mkBuy(sku, consume));
  skulist.push(sku);
}

/* Query the store for the details of all listed SKUs */
google.payments.inapp.getSkuDetails(skulist, function(details) {
  for (var i=0; i<details.length; i++) {
    var sel = 'div[data-sku="'+details[i].productId +'"]';
    var elem = document.querySelector(sel);
    if (elem) {
      priceElem = elem.querySelector('.price');
      if (priceElem) {
       priceElem.innerHTML = details[i].price;
      }
    }
  }
}, function() {
  console.log("Failed to get SKU details");
});


/* Handle the top-line status bar. Toggle state as billing availability
 * changes.
 */
google.payments.onBillingAvailable.addListener(function(ev) {
    document.getElementById("status").classname="available";
});
google.payments.onBillingUnavailable.addListener(function(ev) {
    document.getElementById("status").className="unavailable";
});

/* Set the initial state of the top-line status bar. */
if (google.payments.billingAvailable) {
    document.getElementById("status").className="available";
}

/* Utility function to set the quantity-owned label for a given SKU */
function setQty(sku, value) {
  var sel = 'div[data-sku="'+sku +'"]';
  var elem = document.querySelector(sel);
  if (elem) {
    qtyElem = elem.querySelector('.qty');
    if (qtyElem) {
     qtyElem.innerHTML = value;
    }
  }
}

/* Storage listener: Update the quantity labels as quantities change in
 * local storage */
chrome.storage.onChanged.addListener(function(changes, areaName) {
  if (areaName == 'local') {
    for (var sku in changes) {
      if (changes.hasOwnProperty(sku)) {
         setQty(sku, changes[sku].newValue);
      }
    }
  }
});

/* Get the initial quantities stored and display them */
chrome.storage.local.get(null, function(values) {
  for (var sku in values) {
      if (values.hasOwnProperty(sku)) {
         setQty(sku, values[sku]);
      }
  }
});
