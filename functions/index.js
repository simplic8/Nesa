// Copyright 2018, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// Import the Dialogflow module and response creation dependencies
// from the Actions on Google client library.
const {
  dialogflow,
  BasicCard,
  Permission,
  SimpleResponse,
  Button,
  Image,
  List
} = require('actions-on-google');

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');
const fetch = require('node-fetch');

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
  // Asks the user's permission to know their name and location, for personalization and service provision.
  conv.ask(new Permission({
    context: 'Hi there, I\'m Nesa, to provide suggestions, ',
    permissions: ['NAME', 'DEVICE_PRECISE_LOCATION'],
  }));
});

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
  if (!permissionGranted) {
    // If the user denied our request, go ahead with the conversation.
    conv.ask(`Ok, no worries. Let's proceed as anonymous without suggested places. Trigger a 'meeting'.`);
  } else {
    // If the user accepted our request, store their name in
    // the 'conv.data' object for the duration of the conversation.
    conv.data.userName = conv.user.name.display;
    conv.data.locationLat="";
    conv.data.locationLng="";
    if(conv.device.location.coordinates == null) {
        conv.data.locationLat = "undefined";
        conv.data.locationLng = "undefined";
    } else {
        conv.data.locationLat = conv.device.location.coordinates.latitude;
        conv.data.locationLng = conv.device.location.coordinates.longitude;
    }
    var fetchUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + conv.data.locationLat + ',' + conv.data.locationLng + '&radius=1500&type=restaurant&key=AIzaSyAKglNhjNziHo8szsFI6SEEnzWfbJQUXhc';
    var getSuggestedPlacesDump = "";
    var jsonFetch = fetch(fetchUrl)
    .then(function(response) {
      // conv.ask(`Thanks, ${conv.data.userName}. We are querying ${conv.data.locationLat},${conv.data.locationLng} via ${fetchUrl}. Here are the suggested places: ${getSuggestedPlacesDump}`);
      console.log(response);
      return response.json();
    }).catch(err => {
      // conv.ask(`Thanks, ${conv.data.userName}. We are querying ${conv.data.locationLat},${conv.data.locationLng} via ${fetchUrl}. However, the search timed out. Please try again later.`);
      console.log(err);
    });
    
    conv.ask(new SimpleResponse({
      speech: 'Thanks ' + conv.data.userName + '. We are querying based on your location.',
      text: 'Thanks ' + conv.data.userName + '. We are querying based on your location. The link is generated below. ',
    }));

    conv.ask(new BasicCard({
      text: `See what suggestions Google Maps have for you by clicking the link below`,
      //subtitle: 'This is a subtitle',
      //title: 'Title: this is a title',
      buttons: new Button({
        title: 'Goto Google MAP API responses',
        url: fetchUrl,
      }),
      image: new Image({
        url: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/23/GoogleMaps.svg/250px-GoogleMaps.svg.png',
        alt: 'Google Maps',
      }),
    }));

    conv.add(`Let's proceed with a 'meeting'.`);
  }

  app.intent('response_schedule_event', (conv) => {

    conv.ask(`Sure, who's going?`);
    
    // Build contact list
    var listItems = new List({
      title: 'Nearby friends',
      items: {
        // Add the first item to the list
        'Invite: John Doe': {
          title: 'John Doe',
          description: 'mahari738@gmail.com',
        },
  
        'Invite: Bobby Bobinson': {
          title: 'Bobby Bobinson',
          description: 'matthiaslwm@gmail.com',
        },
      }
    })
  
    conv.add(listItems);
  
    conv.add(new BasicCard({
      text: `I'm under development to improve my services. Please try again later - Nesa.`,
      //subtitle: 'This is a subtitle',
      //title: 'Title: this is a title',
      image: new Image({
        url: 'http://www.ocamljava.org/img/underconstruction.png',
        alt: 'Under Construction',
      }),
    }));

      //TO-DO create arraylist for people around you via GEO-TAG
      
  });
  
  app.intent('response_names', (conv => {
  
    conv.ask('Where is it gonna be?');
  
    var listItems = new List({
      title: 'Nearby restaurants',
      items: {
        // Add the first item to the list
        'Restaurant: Yuan Cheng Fried Carrot Cake': {
          title: 'Yuan Cheng Fried Carrot Cake',
          description: '79 Telok Blangah Dr #01-33, Singapore 100079 Telok Blangah Drive, Singapore',
        },
  
        'Restaurant: Keng Eng Kee Seafood': {
          title: 'Keng Eng Kee Seafood',
          description: '124 Bukit Merah Lane 1, #01-136',
        },
      }
    })
  
    conv.ask(listItems);
  
    venue = "Yuan Cheng Fried Carrot Cake";
  
  }));
  
  app.intent('response_location', (conv) => {
  
    conv.ask('Great choice! When is it gonna be?');
  
  });
  
  app.intent('response_when', (conv) => {
  
    conv.close(`We're all set! Sending invitation... Invitation sent! Give your friends a few moments to respond.`);
    //ENHANCEMENT: Google Calender to find suitable timing for both parties.
  
  });

});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
