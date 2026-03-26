let accidentDetected = false;
let currentFacingMode = "environment";
let currentStream = null;
let savedLocation = null;
let contacts = JSON.parse(localStorage.getItem("roadsos_contacts")) || [];

const contactInput = document.getElementById("contactInput");
const contactList = document.getElementById("contactList");
const canvas = document.getElementById("canvas");
const video = document.getElementById("cameraVideo");
const downloadPhoto = document.getElementById("downloadPhoto");
const logBox = document.getElementById("log");
const locationStatus = document.getElementById("locationStatus");
const permissionStatus = document.getElementById("permissionStatus");

function addLog(message) {
  const time = new Date().toLocaleTimeString();
  logBox.innerHTML = `<div>[${time}] ${message}</div>` + logBox.innerHTML;
}

function sanitizeNumber(num) {
  return num.replace(/\D/g, "");
}

function renderContacts() {
  contactList.innerHTML = "";

  if (contacts.length === 0) {
    contactList.innerHTML = `<div class="muted">No contacts added</div>`;
    return;
  }

  contacts.forEach((num, index) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      <span>${num}</span>
      <button onclick="removeContact(${index})">X</button>
    `;
    contactList.appendChild(chip);
  });
}

function removeContact(index) {
  contacts.splice(index, 1);
  renderContacts();
}

function saveContacts() {
  localStorage.setItem("roadsos_contacts", JSON.stringify(contacts));
  addLog("Contacts saved");
  alert("Contacts saved");
}

function clearContacts() {
  contacts = [];
  localStorage.removeItem("roadsos_contacts");
  renderContacts();
  addLog("All contacts cleared");
}

function addContact() {
  const value = sanitizeNumber(contactInput.value.trim());

  if (!value) {
    alert("Enter a valid number");
    return;
  }

  if (contacts.includes(value)) {
    alert("Contact already added");
    return;
  }

  contacts.push(value);
  contactInput.value = "";
  renderContacts();
  addLog(`Contact added: ${value}`);
}

async function startCamera() {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode },
      audio: false
    });

    currentStream = stream;
    video.srcObject = stream;
    addLog("Camera started");
  } catch (e) {
    console.error("Camera error:", e);
    addLog("Camera access failed");
    alert("Camera access failed");
  }
}

function switchCamera() {
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  startCamera();
}

function capturePhoto() {
  if (!video.videoWidth || !video.videoHeight) {
    alert("Camera not ready yet");
    return;
  }

  canvas.style.display = "block";
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageURL = canvas.toDataURL("image/jpeg");
  downloadPhoto.href = imageURL;

  addLog("Photo captured");
}

function getMapsLink(lat, lon) {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

function getNearbyHospitalLink(lat, lon) {
  return `https://www.google.com/maps/search/hospital+near+me/@${lat},${lon},15z`;
}

function requestLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    locationStatus.textContent = "Location: Not supported";
    return;
  }

  locationStatus.textContent = "Location: Fetching...";
  permissionStatus.textContent = "Permissions: Requesting";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      savedLocation = { lat, lon };
      locationStatus.textContent = `Location: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      permissionStatus.textContent = "Permissions: Granted";
      addLog("Location fetched successfully");
    },
    (error) => {
      console.error(error);
      locationStatus.textContent = "Location: Failed";
      permissionStatus.textContent = "Permissions: Denied";
      addLog("Location fetch failed");
      alert("Unable to fetch location");
    }
  );
}

function copyMapsLink() {
  if (!savedLocation) {
    alert("Get location first");
    return;
  }

  const link = getMapsLink(savedLocation.lat, savedLocation.lon);
  navigator.clipboard.writeText(link)
    .then(() => {
      addLog("Maps link copied");
      alert("Maps link copied");
    })
    .catch(() => {
      alert("Copy failed");
    });
}

function buildSOSMessage() {
  let message = "HELP! I may be in danger or had an accident.";

  if (savedLocation) {
    message += ` My live location: ${getMapsLink(savedLocation.lat, savedLocation.lon)}`;
  } else {
    message += " Location not available.";
  }

  return message;
}

function openWhatsAppForAll(message) {
  contacts.forEach((number, index) => {
    const waURL = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    setTimeout(() => {
      window.open(waURL, "_blank");
    }, index * 800);
  });

  addLog("WhatsApp opened for all contacts");
}

function openSMSForAll(message) {
  contacts.forEach((number, index) => {
    const smsURL = `sms:${number}?body=${encodeURIComponent(message)}`;

    setTimeout(() => {
      window.open(smsURL, "_blank");
    }, index * 800);
  });

  addLog("SMS opened for all contacts");
}

function sendSOS() {
  if (contacts.length === 0) {
    alert("Please add at least one trusted contact");
    return;
  }

  const proceed = () => {
    const message = buildSOSMessage();

    openWhatsAppForAll(message);
    openSMSForAll(message);

    if (document.getElementById("toggleHospitals").checked && savedLocation) {
      setTimeout(() => {
        window.open(getNearbyHospitalLink(savedLocation.lat, savedLocation.lon), "_blank");
      }, 2000);
    }

    addLog("SOS triggered");
    alert("SOS started: WhatsApp and SMS opened with help message");
  };

  if (savedLocation) {
    proceed();
  } else {
    if (!navigator.geolocation) {
      proceed();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        savedLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        locationStatus.textContent = `Location: ${savedLocation.lat.toFixed(5)}, ${savedLocation.lon.toFixed(5)}`;
        permissionStatus.textContent = "Permissions: Granted";
        proceed();
      },
      () => {
        proceed();
      }
    );
  }
}

function callPolice() {
  window.location.href = "tel:100";
}

function callAmbulance() {
  window.location.href = "tel:108";
}

function bindButtons() {
  document.getElementById("btnAddContact").addEventListener("click", addContact);
  document.getElementById("btnClearContacts").addEventListener("click", clearContacts);
  document.getElementById("btnSaveContacts").addEventListener("click", saveContacts);

  document.getElementById("btnGetLocation").addEventListener("click", requestLocation);
  document.getElementById("btnCopyLink").addEventListener("click", copyMapsLink);

  document.getElementById("btnCapture").addEventListener("click", capturePhoto);
  document.getElementById("btnSwitchCamera").addEventListener("click", switchCamera);
  document.getElementById("btnRestartCamera").addEventListener("click", startCamera);

  document.getElementById("btnSendSOS").addEventListener("click", sendSOS);

  document.getElementById("btnPolice").addEventListener("click", callPolice);
  document.getElementById("btnAmbulance").addEventListener("click", callAmbulance);

  document.getElementById("btnTest").addEventListener("click", () => {
    addLog("Demo run started");
    alert("Demo mode working");
  });
}

window.addEventListener("devicemotion", function (event) {
  if (!document.getElementById("toggleAutoDetect").checked) return;

  let acc = event.accelerationIncludingGravity;
  if (!acc) return;

  let x = acc.x || 0;
  let y = acc.y || 0;
  let z = acc.z || 0;

  let total = Math.sqrt(x * x + y * y + z * z);

  if (total > 25 && !accidentDetected) {
    accidentDetected = true;

    addLog("Possible accident detected");
    capturePhoto();

    let confirmSOS = confirm("Accident detected! Send SOS?");
    if (confirmSOS) {
      sendSOS();
    }

    setTimeout(() => {
      accidentDetected = false;
    }, 10000);
  }
});

renderContacts();
bindButtons();
startCamera();