let accidentDetected = false;



async function startCamera(){

try{

let stream = await navigator.mediaDevices.getUserMedia({video:true});

document.getElementById("cameraVideo").srcObject = stream;

}catch(e){

console.log("Camera error",e);

}

}



function capturePhoto(){

let video = document.getElementById("cameraVideo");
let canvas = document.getElementById("canvas");

canvas.style.display = "block";

canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

let ctx = canvas.getContext("2d");

ctx.drawImage(video,0,0,canvas.width,canvas.height);

}






startCamera();



function sendSOS(){

let contact = document.getElementById("contact").value;

if(contact==""){

alert("Please enter emergency contact number with country code");

return;

}

if(navigator.geolocation){

navigator.geolocation.getCurrentPosition(function(position){

let lat = position.coords.latitude;
let lon = position.coords.longitude;

document.getElementById("location").innerHTML =
" Location: "+lat+" , "+lon;



let message =
" Emergency! I need help.\nMy location:\nhttps://maps.google.com/?q="+lat+","+lon;



let whatsappURL =
"https://api.whatsapp.com/send?phone="+contact+"&text="+encodeURIComponent(message);



window.open(whatsappURL,"_blank");



setTimeout(function(){
// Use the standard Google Maps search query with coordinates.
let mapsURL =
"https://www.google.com/maps/search/?api=1&query=hospital%20near%20"+lat+","+lon;
window.open(mapsURL, "_blank", "noopener");
},3000);


});

}
else{

alert("Geolocation not supported");

}

}



window.addEventListener("devicemotion", function(event){

let acc = event.accelerationIncludingGravity;

if(!acc) return;

let x = acc.x;
let y = acc.y;
let z = acc.z;

let totalAcceleration = Math.sqrt(x*x + y*y + z*z);

if(totalAcceleration > 25 && !accidentDetected){

accidentDetected = true;

let confirmSOS = confirm("⚠ Possible Accident Detected!\nSend SOS?");

if(confirmSOS){

sendSOS();

}

}

});
