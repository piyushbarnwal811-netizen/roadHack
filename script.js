let accidentDetected = false;
let currentFacingMode = "environment";
let currentStream;

// API base: local dev -> localhost, deployed -> replace with your backend URL
const API_BASE =
    (location.hostname === "localhost" || location.hostname === "127.0.0.1")
        ? "http://localhost:3000"
        : "https://YOUR-BACKEND-URL";

async function startCamera(){
    try{
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

function switchCamera(){
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    startCamera();
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

async function sendSOS(){
    let input = document.getElementById("contact").value;

    if(input==""){
        alert("Enter contact numbers");
        return;
    }

    let contacts = input.split(",");

    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(async function(position){
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;

            let canvas = document.getElementById("canvas");

            canvas.toBlob(async function(blob){
                if(!blob){
                    alert("Unable to capture photo");
                    return;
                }

                let formData = new FormData();
                formData.append("photo", blob);
                formData.append("contacts", contacts.join(","));
                formData.append("lat", lat);
                formData.append("lon", lon);

                let res = await fetch(`${API_BASE}/send-sos`,{
                    method:"POST",
                    body: formData
                });

                let data = await res.json();

                alert("? SOS Sent Successfully");

                console.log(data);

                setTimeout(()=>{
                    let mapsURL =
                    "https://www.google.com/maps/search/?api=1&query=hospital%20near%20"+lat+","+lon;
                    window.open(mapsURL);
                },3000);

            });

        });

    }else{
        alert("Geolocation not supported");
    }
}

function callPolice(){
    window.location.href = "tel:100";
}

function callAmbulance(){
    window.location.href = "tel:108";
}

window.addEventListener("devicemotion", function(event){
    let acc = event.accelerationIncludingGravity;
    if(!acc) return;

    let x = acc.x;
    let y = acc.y;
    let z = acc.z;

    let total = Math.sqrt(x*x + y*y + z*z);

    if(total > 25 && !accidentDetected){
        accidentDetected = true;

        capturePhoto(); 

        let confirmSOS = confirm("? Accident Detected!\nSend SOS?");

        if(confirmSOS){
            sendSOS();
        }

        setTimeout(()=>{
            accidentDetected = false;
        },10000);
    }
});

startCamera();
