const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true,});

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild;

    //height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //height of message container
    const containerHeight = $messages.scrollHeight;

    //how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight - 5 <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
console.log(message);
const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('H:mm a'),
});
$messages.insertAdjacentHTML('beforeend', html);
autoscroll();
})

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage);
    const locationURL = locationMessage.locationURL;
    const html = Mustache.render(locationTemplate, {
        username,
        locationURL,
        createdAt: moment(locationMessage.createdAt).format('H:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({room, users,}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = event.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error) {
            return console.log(error);
        } else {
            console.log('Message delivered!');
        }
    });
})

$sendLocationButton.addEventListener('click', (event) => {
    event.preventDefault();
    if(!navigator.geolocation) {
        return alert('Geo-location is not support by your browser');
    } else {
        $sendLocationButton.setAttribute('disabled', 'disabled');
        navigator.geolocation.getCurrentPosition((position) => {
            socket.emit('sendLocation', {
                latitude: position.coords.latitude, 
                longitude: position.coords.longitude,
            }, () => {
                $sendLocationButton.removeAttribute('disabled');
                console.log('Location shared!');
            });
        })
    }
   
})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
})
