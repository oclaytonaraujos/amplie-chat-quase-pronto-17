# Evolution API Documentation

Evolution API is an open-source platform dedicated to empowering small businesses, entrepreneurs, freelancers, and individuals with limited resources by providing a free WhatsApp™ messaging API solution. It supports integrations with platforms like Typebot, Chatwoot, Dify, and OpenAI, and uses the Baileys library for WhatsApp control, with support for the official WhatsApp Business API and future plans for Instagram and Messenger. This document consolidates the key endpoints with JavaScript examples for usage.

## Início (Getting Started)

The Evolution API allows quick setup using Docker for testing and development. Below is the setup process and an example to verify the API is running.

### Setup Instructions
To run the Evolution API:
1. Ensure Docker is installed (see [Docker Official Documentation](https://docs.docker.com)).
2. Execute the following command, replacing `AUTHENTICATION_API_KEY` with your preferred key:

```bash
docker run -d \
    --name evolution_api \
    -p 8080:8080 \
    -e AUTHENTICATION_API_KEY=mude-me \
    atendai/evolution-api:latest
```

3. Verify the API is running by accessing `http://localhost:8080`. Expected response:

```json
{
   "status": 200,
   "message": "Welcome to the Evolution API, it is working!",
   "version": "1.x.x",
   "swagger": "http://localhost:8080/docs",
   "manager": "http://localhost:8080/manager",
   "documentation": "https://doc.evolution-api.com"
}
```

**Note**: CLI execution is recommended for testing/development, not production. Use `docker-compose` for production deployments.

### JavaScript Example: Verify API Status
```javascript
const API_KEY = 'your-api-key';
const BASE_URL = 'http://localhost:8080';

async function checkApiStatus() {
    try {
        const response = await fetch(`${BASE_URL}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error checking API status:', error);
    }
}

checkApiStatus();
```

## Instances

Manage WhatsApp instances for connecting and controlling sessions.

### GET: Get Information
Retrieve general information about the API.

```javascript
async function getInformation() {
    try {
        const response = await fetch(`${BASE_URL}/info`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching information:', error);
    }
}

getInformation();
```

### POST: Create Instance Basic
Create a new WhatsApp instance.

```javascript
async function createInstance() {
    try {
        const response = await fetch(`${BASE_URL}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                instanceName: 'myInstance',
                qrcode: true
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error creating instance:', error);
    }
}

createInstance();
```

### GET: Fetch Instances
List all instances.

```javascript
async function fetchInstances() {
    try {
        const response = await fetch(`${BASE_URL}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching instances:', error);
    }
}

fetchInstances();
```

### GET: Instance Connect
Connect an instance and retrieve the QR code.

```javascript
async function instanceConnect(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error connecting instance:', error);
    }
}

instanceConnect('myInstance');
```

### PUT: Restart Instance
Restart an existing instance.

```javascript
async function restartInstance(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/instance/restart/${instanceName}`, {
            method: 'PUT',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error restarting instance:', error);
    }
}

restartInstance('myInstance');
```

### GET: Connection State
Check the connection state of an instance.

```javascript
async function getConnectionState(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/instance/connectionState/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching connection state:', error);
    }
}

getConnectionState('myInstance');
```

### DEL: Logout Instance
Log out an instance.

```javascript
async function logoutInstance(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/instance/logout/${instanceName}`, {
            method: 'DELETE',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error logging out instance:', error);
    }
}

logoutInstance('myInstance');
```

### DEL: Delete Instance
Delete an instance.

```javascript
async function deleteInstance(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error deleting instance:', error);
    }
}

deleteInstance('myInstance');
```

### POST: Set Presence
Set the presence status for an instance.

```javascript
async function setPresence(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/instance/setPresence/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                presence: 'online'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error setting presence:', error);
    }
}

setPresence('myInstance');
```

## Webhook

Manage webhook configurations for receiving events.

### POST: Set Webhook
Configure a webhook for an instance.

```javascript
async function setWebhook(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/webhook/set/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                url: 'https://your-webhook-url.com',
                events: ['message']
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
}

setWebhook('myInstance');
```

### GET: Find Webhook
Retrieve webhook settings.

```javascript
async function findWebhook(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/webhook/find/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding webhook:', error);
    }
}

findWebhook('myInstance');
```

## Settings

Manage instance settings.

### POST: Set Settings
Update instance settings.

```javascript
async function setSettings(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/settings/set/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                rejectCall: true,
                msgCall: 'Not available'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error setting settings:', error);
    }
}

setSettings('myInstance');
```

### GET: Find Settings
Retrieve instance settings.

```javascript
async function findSettings(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/settings/find/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding settings:', error);
    }
}

findSettings('myInstance');
```

## Send Message

Send various types of messages via WhatsApp.

### POST: Send Template
Send a template message.

```javascript
async function sendTemplate(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendTemplate/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                template: 'welcome_message',
                components: [
                    { type: 'header', parameters: [{ type: 'text', text: 'User' }] },
                    { type: 'body', parameters: [{ type: 'text', text: 'Welcome!' }] }
                ]
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending template:', error);
    }
}

sendTemplate('myInstance', '1234567890');
```

### POST: Send Plain Text
Send a plain text message.

```javascript
async function sendPlainText(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                text: 'Hello, this is a test message!'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending text:', error);
    }
}

sendPlainText('myInstance', '1234567890');
```

### POST: Send Status
Send a status message.

```javascript
async function sendStatus(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendStatus/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                status: 'Hello, this is my status!'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending status:', error);
    }
}

sendStatus('myInstance');
```

### POST: Send Media
Send a media message (e.g., image).

```javascript
async function sendMedia(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendMedia/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                mediaType: 'image',
                media: 'https://example.com/image.jpg',
                caption: 'Check out this image!'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending media:', error);
    }
}

sendMedia('myInstance', '1234567890');
```

### POST: Send WhatsApp Audio
Send an audio message.

```javascript
async function sendWhatsAppAudio(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendWhatsAppAudio/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                audio: 'https://example.com/audio.mp3'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending audio:', error);
    }
}

sendWhatsAppAudio('myInstance', '1234567890');
```

### POST: Send Sticker
Send a sticker message.

```javascript
async function sendSticker(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendSticker/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                sticker: 'https://example.com/sticker.webp'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending sticker:', error);
    }
}

sendSticker('myInstance', '1234567890');
```

### POST: Send Location
Send a location message.

```javascript
async function sendLocation(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendLocation/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                latitude: -23.5505,
                longitude: -46.6333,
                name: 'São Paulo',
                address: 'São Paulo, SP, Brazil'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending location:', error);
    }
}

sendLocation('myInstance', '1234567890');
```

### POST: Send Contact
Send a contact message.

```javascript
async function sendContact(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendContact/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                contact: {
                    fullName: 'John Doe',
                    phoneNumber: '9876543210'
                }
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending contact:', error);
    }
}

sendContact('myInstance', '1234567890');
```

### POST: Send Reaction
Send a reaction to a message.

```javascript
async function sendReaction(instanceName, phoneNumber, messageId) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendReaction/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                messageId: messageId,
                reaction: '👍'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending reaction:', error);
    }
}

sendReaction('myInstance', '1234567890', 'message_id_here');
```

### POST: Send Poll
Send a poll message.

```javascript
async function sendPoll(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendPoll/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                name: 'Favorite Color',
                options: ['Red', 'Blue', 'Green'],
                selectableCount: 1
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending poll:', error);
    }
}

sendPoll('myInstance', '1234567890');
```

### POST: Send List
Send a list message.

```javascript
async function sendList(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/message/sendList/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                title: 'Choose an option',
                buttonText: 'Select',
                sections: [
                    {
                        title: 'Options',
                        rows: [
                            { rowId: '1', title: 'Option 1', description: 'Description 1' },
                            { rowId: '2', title: 'Option 2', description: 'Description 2' }
                        ]
                    }
                ]
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending list:', error);
    }
}

sendList('myInstance', '1234567890');
```

## Chat Controller

Manage chat-related operations.

### POST: Check is WhatsApp
Verify if a number is registered on WhatsApp.

```javascript
async function checkIsWhatsApp(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/chat/checkIsWhatsApp/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error checking WhatsApp:', error);
    }
}

checkIsWhatsApp('myInstance', '1234567890');
```

### PUT: Mark Message As Read
Mark a message as read.

```javascript
async function markMessageAsRead(instanceName, phoneNumber, messageId) {
    try {
        const response = await fetch(`${BASE_URL}/chat/markAsRead/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                messageId: messageId
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

markMessageAsRead('myInstance', '1234567890', 'message_id_here');
```

### PUT: Archive Chat
Archive a chat.

```javascript
async function archiveChat(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/chat/archive/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                archive: true
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error archiving chat:', error);
    }
}

archiveChat('myInstance', '1234567890');
```

### DEL: Delete Message for Everyone
Delete a message for all participants.

```javascript
async function deleteMessageForEveryone(instanceName, phoneNumber, messageId) {
    try {
        const response = await fetch(`${BASE_URL}/chat/deleteMessage/${instanceName}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                messageId: messageId
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error deleting message:', error);
    }
}

deleteMessageForEveryone('myInstance', '1234567890', 'message_id_here');
```

### POST: Send Presence
Send typing or recording presence.

```javascript
async function sendChatPresence(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/chat/sendPresence/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                presence: 'typing'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending presence:', error);
    }
}

sendChatPresence('myInstance', '1234567890');
```

### POST: Fetch Profile Picture URL
Retrieve a contact's profile picture URL.

```javascript
async function fetchProfilePicture(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/chat/fetchProfilePicture/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching profile picture:', error);
    }
}

fetchProfilePicture('myInstance', '1234567890');
```

### POST: Find Contacts
Retrieve contact information.

```javascript
async function findContacts(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/chat/findContacts/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({})
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding contacts:', error);
    }
}

findContacts('myInstance');
```

### POST: Find Messages
Retrieve messages in a chat.

```javascript
async function findMessages(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/chat/findMessages/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                limit: 10
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding messages:', error);
    }
}

findMessages('myInstance', '1234567890');
```

### POST: Find Status Message
Retrieve status messages.

```javascript
async function findStatusMessage(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/chat/findStatus/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({})
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding status messages:', error);
    }
}

findStatusMessage('myInstance');
```

### PUT: Update Message
Edit an existing message.

```javascript
async function updateMessage(instanceName, phoneNumber, messageId) {
    try {
        const response = await fetch(`${BASE_URL}/chat/updateMessage/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                messageId: messageId,
                text: 'Updated message text'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating message:', error);
    }
}

updateMessage('myInstance', '1234567890', 'message_id_here');
```

### GET: Find Chats
Retrieve all chats for an instance.

```javascript
async function findChats(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/chat/findChats/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding chats:', error);
    }
}

findChats('myInstance');
```

## Profile Settings

Manage WhatsApp profile settings.

### POST: Fetch Business Profile
Retrieve business profile information.

```javascript
async function fetchBusinessProfile(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/profile/fetchBusinessProfile/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({})
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching business profile:', error);
    }
}

fetchBusinessProfile('myInstance');
```

### POST: Fetch Profile
Retrieve profile information.

```javascript
async function fetchProfile(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/profile/fetchProfile/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({})
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

fetchProfile('myInstance');
```

### POST: Update Profile Name
Update the profile name.

```javascript
async function updateProfileName(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/profile/updateProfileName/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                name: 'New Name'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating profile name:', error);
    }
}

updateProfileName('myInstance');
```

### POST: Update Profile Status
Update the profile status.

```javascript
async function updateProfileStatus(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/profile/updateProfileStatus/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                status: 'Available'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating profile status:', error);
    }
}

updateProfileStatus('myInstance');
```

### PUT: Update Profile Picture
Update the profile picture.

```javascript
async function updateProfilePicture(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/profile/updateProfilePicture/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                url: 'https://example.com/profile.jpg'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating profile picture:', error);
    }
}

updateProfilePicture('myInstance');
```

### PUT: Remove Profile Picture
Remove the profile picture.

```javascript
async function removeProfilePicture(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/profile/removeProfilePicture/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({})
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error removing profile picture:', error);
    }
}

removeProfilePicture('myInstance');
```

### GET: Fetch Privacy Settings
Retrieve privacy settings.

```javascript
async function fetchPrivacySettings(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/profile/fetchPrivacySettings/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching privacy settings:', error);
    }
}

fetchPrivacySettings('myInstance');
```

### PUT: Update Privacy Settings
Update privacy settings.

```javascript
async function updatePrivacySettings(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/profile/updatePrivacySettings/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                lastSeen: 'contacts',
                online: 'contacts',
                profile: 'contacts',
                status: 'contacts',
                readreceipts: 'contacts'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating privacy settings:', error);
    }
}

updatePrivacySettings('myInstance');
```

## Group Controller

Manage WhatsApp groups.

### POST: Create Group
Create a new group.

```javascript
async function createGroup(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/group/create/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                subject: 'New Group',
                participants: ['1234567890']
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error creating group:', error);
    }
}

createGroup('myInstance');
```

### PUT: Update Group Picture
Update the group picture.

```javascript
async function updateGroupPicture(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/updateGroupPicture/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                groupJid: groupJid,
                image: 'https://example.com/group.jpg'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating group picture:', error);
    }
}

updateGroupPicture('myInstance', 'group_jid_here');
```

### PUT: Update Group Subject
Update the group subject.

```javascript
async function updateGroupSubject(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/updateGroupSubject/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                groupJid: groupJid,
                subject: 'Updated Group Subject'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating group subject:', error);
    }
}

updateGroupSubject('myInstance', 'group_jid_here');
```

### PUT: Update Group Description
Update the group description.

```javascript
async function updateGroupDescription(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/updateGroupDescription/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                groupJid: groupJid,
                description: 'New group description'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating group description:', error);
    }
}

updateGroupDescription('myInstance', 'group_jid_here');
```

### GET: Fetch Invite Code
Retrieve the group invite code.

```javascript
async function fetchInviteCode(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/fetchInviteCode/${instanceName}?groupJid=${groupJid}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching invite code:', error);
    }
}

fetchInviteCode('myInstance', 'group_jid_here');
```

### GET: Accept Invite Code
Join a group using an invite code.

```javascript
async function acceptInviteCode(instanceName, inviteCode) {
    try {
        const response = await fetch(`${BASE_URL}/group/acceptInviteCode/${instanceName}?inviteCode=${inviteCode}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error accepting invite code:', error);
    }
}

acceptInviteCode('myInstance', 'invite_code_here');
```

### PUT: Revoke Invite Code
Revoke a group invite code.

```javascript
async function revokeInviteCode(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/revokeInviteCode/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                groupJid: groupJid
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error revoking invite code:', error);
    }
}

revokeInviteCode('myInstance', 'group_jid_here');
```

### POST: Send Group Invite
Send a group invite link.

```javascript
async function sendGroupInvite(instanceName, groupJid, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/group/sendGroupInvite/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                groupJid: groupJid,
                phoneNumber: phoneNumber
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error sending group invite:', error);
    }
}

sendGroupInvite('myInstance', 'group_jid_here', '1234567890');
```

### GET: Find Group by Invite Code
Retrieve group information using an invite code.

```javascript
async function findGroupByInviteCode(instanceName, inviteCode) {
    try {
        const response = await fetch(`${BASE_URL}/group/findGroupByInviteCode/${instanceName}?inviteCode=${inviteCode}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding group by invite code:', error);
    }
}

findGroupByInviteCode('myInstance', 'invite_code_here');
```

### GET: Find Group by JID
Retrieve group information by JID.

```javascript
async function findGroupByJid(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/findGroupByJid/${instanceName}?groupJid=${groupJid}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding group by JID:', error);
    }
}

findGroupByJid('myInstance', 'group_jid_here');
```

### GET: Fetch All Groups
List all groups.

```javascript
async function fetchAllGroups(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/group/fetchAllGroups/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching all groups:', error);
    }
}

fetchAllGroups('myInstance');
```

### GET: Find Group Members
Retrieve group members.

```javascript
async function findGroupMembers(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/findGroupMembers/${instanceName}?groupJid=${groupJid}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding group members:', error);
    }
}

findGroupMembers('myInstance', 'group_jid_here');
```

### PUT: Update Group Members
Update group members (add/remove).

```javascript
async function updateGroupMembers(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/updateGroupMembers/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                groupJid: groupJid,
                participants: ['1234567890'],
                action: 'add'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating group members:', error);
    }
}

updateGroupMembers('myInstance', 'group_jid_here');
```

### PUT: Update Group Setting
Update group settings (e.g., restrict editing).

```javascript
async function updateGroupSetting(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/updateGroupSetting/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                groupJid: groupJid,
                setting: 'restrict',
                value: true
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error updating group setting:', error);
    }
}

updateGroupSetting('myInstance', 'group_jid_here');
```

### PUT: Toggle Ephemeral
Toggle ephemeral messaging for a group.

```javascript
async function toggleEphemeral(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/toggleEphemeral/${instanceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                groupJid: groupJid,
                expiration: 604800 // 7 days
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error toggling ephemeral:', error);
    }
}

toggleEphemeral('myInstance', 'group_jid_here');
```

### DEL: Leave Group
Leave a group.

```javascript
async function leaveGroup(instanceName, groupJid) {
    try {
        const response = await fetch(`${BASE_URL}/group/leaveGroup/${instanceName}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                groupJid: groupJid
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error leaving group:', error);
    }
}

leaveGroup('myInstance', 'group_jid_here');
```

## Typebot

Manage Typebot integration.

### POST: Set Typebot
Configure Typebot settings.

```javascript
async function setTypebot(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/typebot/set/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                url: 'https://your-typebot-url.com',
                enabled: true
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error setting Typebot:', error);
    }
}

setTypebot('myInstance');
```

### POST: Start Typebot
Start a Typebot session.

```javascript
async function startTypebot(instanceName, phoneNumber) {
    try {
        const response = await fetch(`${BASE_URL}/typebot/start/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                typebot: 'welcome-flow'
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error starting Typebot:', error);
    }
}

startTypebot('myInstance', '1234567890');
```

### GET: Find Typebot
Retrieve Typebot settings.

```javascript
async function findTypebot(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/typebot/find/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding Typebot:', error);
    }
}

findTypebot('myInstance');
```

### POST: Change Typebot Status
Change the Typebot status.

```javascript
async function changeTypebotStatus(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/typebot/changeStatus/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                enabled: false
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error changing Typebot status:', error);
    }
}

changeTypebotStatus('myInstance');
```

## Chatwoot

Manage Chatwoot integration.

### POST: Set Chatwoot
Configure Chatwoot settings.

```javascript
async function setChatwoot(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/chatwoot/set/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                url: 'https://your-chatwoot-url.com',
                enabled: true
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error setting Chatwoot:', error);
    }
}

setChatwoot('myInstance');
```

### GET: Find Chatwoot
Retrieve Chatwoot settings.

```javascript
async function findChatwoot(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/chatwoot/find/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding Chatwoot:', error);
    }
}

findChatwoot('myInstance');
```

## SQS

Manage Amazon SQS integration.

### POST: Set SQS
Configure SQS settings.

```javascript
async function setSQS(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/sqs/set/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                url: 'https://sqs.your-region.amazonaws.com',
                accessKeyId: 'your-access-key',
                secretAccessKey: 'your-secret-key',
                enabled: true
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error setting SQS:', error);
    }
}

setSQS('myInstance');
```

### GET: Find SQS
Retrieve SQS settings.

```javascript
async function findSQS(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/sqs/find/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding SQS:', error);
    }
}

findSQS('myInstance');
```

## RabbitMQ

Manage RabbitMQ integration.

### POST: Set RabbitMQ
Configure RabbitMQ settings.

```javascript
async function setRabbitMQ(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/rabbitmq/set/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                url: 'amqp://your-rabbitmq-url',
                enabled: true
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error setting RabbitMQ:', error);
    }
}

setRabbitMQ('myInstance');
```

### GET: Find RabbitMQ
Retrieve RabbitMQ settings.

```javascript
async function findRabbitMQ(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/rabbitmq/find/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding RabbitMQ:', error);
    }
}

findRabbitMQ('myInstance');
```

## WebSocket

Manage WebSocket integration for Chatwoot.

### GET: Find Chatwoot (WebSocket)
Retrieve WebSocket settings for Chatwoot.

```javascript
async function findChatwootWebSocket(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/websocket/findChatwoot/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error finding Chatwoot WebSocket:', error);
    }
}

findChatwootWebSocket('myInstance');
```

### POST: Set Chatwoot (WebSocket)
Configure WebSocket settings for Chatwoot.

```javascript
async function setChatwootWebSocket(instanceName) {
    try {
        const response = await fetch(`${BASE_URL}/websocket/setChatwoot/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                url: 'wss://your-chatwoot-websocket-url.com',
                enabled: true
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error setting Chatwoot WebSocket:', error);
    }
}

setChatwootWebSocket('myInstance');
```

## Additional Notes
- **Authentication**: All requests require the `apikey` header with your `AUTHENTICATION_API_KEY`.
- **Postman Collection**: For further details and testing, use the official Postman collection: [Evolution API Postman Collection](https://www.postman.com/agenciadgcode/evolution-api/documentation/jn0bbzv/evolution-api-v2-2-2).[](https://doc.evolution-api.com/v1/en/get-started/introduction)
- **Repository**: Access the source code and contribute at [GitHub - EvolutionAPI](https://github.com/EvolutionAPI/evolution-api).[](https://github.com/EvolutionAPI/evolution-api)
- **Production Deployment**: Use `docker-compose` for production to ensure stability and scalability.
- **Supported Integrations**: The API supports Typebot, Chatwoot, Dify, OpenAI, and both Baileys-based and official WhatsApp Business APIs.[](https://doc.evolution-api.com/v2/pt/get-started/introduction)

For more details, refer to the official documentation at [https://doc.evolution-api.com/](https://doc.evolution-api.com/).