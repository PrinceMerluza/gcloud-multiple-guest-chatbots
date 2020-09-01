import names from './names.js';
import messages from './messages.js';

const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;


let chatterCount = 3; // Default
const minReplyTime = 10;
const maxReplyTime = 90;
let chatters = [];

const chatConfig = {
    organizationId: '03671e89-0883-48b0-8284-cd5260c38745',
    deploymentId: 'e72ce615-18c1-4a11-bba4-dceb3fe912df',
    routingTarget: {
        targetType: 'queue',
        targetAddress: 'Prince Test Queue'
    }
}

function initiateChatters(){
    createChatters()
    .then((chattersData) => {
        chatters = chattersData;

        for(let i = 0; i < chatters.length; i++){
            sendMessage(chatters[i], true);
        }
    })
    .catch((e) => console.error(e));
}

function sendMessage(chatterData, isInitial){
    let message = isInitial ?
        "Hi  ( ͡° ͜ʖ ͡°), I am a randomly-named bot. This is being managed by an app made by me (Prince) which automatically connects n number of 'customers' to a queue and have them send random movie/video game/show quotes at random intervals. This is for testing purposes and because I'm too lazy to manually use the developer chat tools everytime I want to test simultaneous chat interactions. 🤟" 
        : messages[Math.floor(Math.random() * messages.length)]

    fetch(
        `https://api.mypurecloud.com/api/v2/webchat/guest/conversations/${chatterData.id}/members/${chatterData.member.id}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${chatterData.jwt}`
        },
        body: JSON.stringify({
            body: message,
            bodyType: 'standard'
        })
    })
    .then(() => {
        console.log('Message sent.');

        let timeout = 1000 * (Math.floor(
            Math.random() * (maxReplyTime - minReplyTime)) + minReplyTime);

        setTimeout(() => {
            sendMessage(chatterData, false);
        }, timeout);
    })
    .catch(e => console.error(e));
}

function createChatters(){
    let promisesArr = [];

    for(let i = 0; i < chatterCount; i++){
        const lastName = names.lastName[Math.floor(Math.random() * 
                            names.lastName.length)];
        const firstName = names.firstName[Math.floor(Math.random() * 
                            names.firstName.length)] + 
                            ' ' +
                            names.firstName[Math.floor(Math.random() * 
                            names.firstName.length)]; 
        const fullName = `[BOT] ${firstName} ${lastName}`;

        const memberInfo = {
            displayName : fullName,
            lastName: firstName,
            firstName: lastName,
            email: `${firstName}.${lastName}@example.com`
        }

        chatConfig.memberInfo = memberInfo;
        console.log(`Built the guy: ${fullName}`);

        // POST
        let promise = new Promise((resolve, reject) => {
            fetch(
                'https://api.mypurecloud.com/api/v2/webchat/guest/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chatConfig)
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                const streamUri = data.eventStreamUri;
    
                // Create WebSocket connection.
                const socket = new WebSocket(streamUri);
    
                // Connection opened
                socket.addEventListener('open', function (event) {
                    console.log(`Websocket connected for ${fullName}`);
                    resolve(data);
                });
    
                // Listen for messages
                socket.addEventListener('message', function (event) {
                    // console.log(`Message from server for ${fullName}`, event.data);
                });
            })
            .catch(e => reject(e));
        })        

        promisesArr.push(promise);
    }

    return Promise.all(promisesArr);
}

document.getElementById('initiate')
        .addEventListener('click', () => {
    initiateChatters();
})
document.getElementById('range-chatter-count')
.addEventListener('input', (event) => {
    let el = event.target;
    chatterCount = parseInt(el.value);

    document.getElementById('span-chatter-count')
    .innerText = chatterCount;
})

client.loginImplicitGrant('e7de8a75-62bb-43eb-9063-38509f8c21af', 
    window.location.href)
.then((data) => {
    console.log(data);
    // Do authenticated things
})
.catch((err) => {
    // Handle failure response
    console.log(err);
});