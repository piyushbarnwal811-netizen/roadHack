let accidentDetected = false;
let currentFacingMode = "environment";
let currentStream;

// 📷 Start Camera (Back Camera)
async function startCamera(){
    try{

        // old stream band karo (important fix)
        if(currentStream){
            currentStream.getTracks().forEach(track => track.stop());
        }

        let stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode }
        });

        currentStream = stream;

        document.getElementById("cameraVideo").srcObject = stream;

    }catch(e){
        console.log("Camera error",e);
    }
}

// 🔄 Switch Camera
async function switchCamera(){
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    startCamera();
}

// 📸 Capture Photo
function capturePhoto(){

    let video = document.getElementById("cameraVideo");
    let canvas = document.getElementById("canvas");

    canvas.style.display = "block";

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let ctx = canvas.getContext("2d");

    ctx.drawImage(video,0,0,canvas.width,canvas.height);
}

// 🚨 Send SOS
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
            "📍 Location: "+lat+" , "+lon;

            let message =
            "🚨 Emergency! I need help.\nMy location:\nhttps://maps.google.com/?q="+lat+","+lon;

            let whatsappURL =
            "https://api.whatsapp.com/send?phone="+contact+"&text="+encodeURIComponent(message);

            window.open(whatsappURL,"_blank");

            setTimeout(function(){
                let mapsURL =
                "https://www.google.com/maps/search/?api=1&query=hospital%20near%20"+lat+","+lon;
                window.open(mapsURL, "_blank");
            },3000);

        });

    }else{
        alert("Geolocation not supported");
    }
}

// 🚓 Police Call
function callPolice(){
    window.location.href = "tel:100";
}

// 🚑 Ambulance Call
function callAmbulance(){
    window.location.href = "tel:108";
}

// 📱 Accident Detection (Improved)
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

        // 🔥 reset after 10 sec (important)
        setTimeout(()=>{
            accidentDetected = false;
        },10000);
    }

});

// Start camera
startCamera();