# In-App Purchases Test App

This app provides test purchases for Android and iOS.

Users can purchase consumable and non-consumable products and attempt to purchase non-existent and unavailable products.

Additionally, on Android, users can buy test products provided by Google.

## Preparation

### Android

[Coming soon!]

### iOS

In order to access Apple's in-app purchase sandbox, you must create a test user through your Apple Developer account.  Instructions on how to do so can be found [here](https://developer.apple.com/library/ios/documentation/LanguagesUtilities/Conceptual/iTunesConnect_Guide/Chapters/SettingUpUserAccounts.html).

## Using the App

On launch, you will be presented with a list of items to purchase.  Each item also lists how many have been previously purchased.

Tap an item to attempt to purchase it.  This will initiate the platform-specific purchase flow; follow the instructions to purchase the item.  If the purchase is successful, the corresponding counter will increase.

**Note:** Apple's in-app purchase sandbox is currently inaccessible due to technical issues, so product information retrieval and purchase attempts may fail.  Updates can be found [here](https://devforums.apple.com/thread/216969).

## Purchase Persistence

All purchases are stored on the device using the chrome.storage API and will be fetched on subsequent runs.  

Consumable purchases are *not* synced across devices.

Non-consumable purchases are also not synced, but attempts to purchase one on another device will notify you that the product has already been purchased and ask you to download it.
