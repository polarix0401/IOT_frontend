// --- Login/session logic ---
let userId = localStorage.getItem('user_id');
let mcuId = null; // Will be loaded from backend after login
let sensorsByName = {}; // For quick lookup of sensor_id by name

function logout() {
  localStorage.removeItem('user_id');
  window.location.href = "login.html";
}

// --- Dashboard input/validation ---
const tempInput = document.getElementById('input-temp');
const airInput = document.getElementById('input-air');
const lightInput = document.getElementById('input-light');
const water1Input = document.getElementById('input-water1');
const water2Input = document.getElementById('input-water2');
const tempError = document.getElementById('temp-error');
const airError = document.getElementById('air-error');
const lightError = document.getElementById('light-error');
const water1Error = document.getElementById('water1-error');
const water2Error = document.getElementById('water2-error');
const updateBtn = document.getElementById('update-btn');

function validateInputs() {
  const tempValue = tempInput.value.trim();
  const airValue = airInput.value.trim();
  const lightValue = lightInput.value;
  const water1Value = water1Input.value;
  const water2Value = water2Input.value;
  let isAnyValid = false;
  let isValid = true;
  if (tempValue !== '') {
    const tempNum = parseFloat(tempValue);
    if (isNaN(tempNum) || tempNum < 25 || tempNum > 35) {
      tempError.style.display = 'block';
      isValid = false;
    } else {
      tempError.style.display = 'none';
      isAnyValid = true;
    }
  } else {
    tempError.style.display = 'none';
  }
  if (airValue !== '') {
    const airNum = parseFloat(airValue);
    if (isNaN(airNum) || airNum < 50 || airNum > 200) {
      airError.style.display = 'block';
      isValid = false;
    } else {
      airError.style.display = 'none';
      isAnyValid = true;
    }
  } else {
    airError.style.display = 'none';
  }
  if (lightValue !== '') {
    lightError.style.display = 'none';
    isAnyValid = true;
  } else {
    lightError.style.display = 'none';
  }
  if (water1Value !== '') {
    water1Error.style.display = 'none';
    isAnyValid = true;
  } else {
    water1Error.style.display = 'none';
  }
  if (water2Value !== '') {
    water2Error.style.display = 'none';
    isAnyValid = true;
  } else {
    water2Error.style.display = 'none';
  }
  updateBtn.disabled = !(isValid && isAnyValid);
}

function animateInput(element) {
  element.classList.remove('input-animate');
  void element.offsetWidth;
  element.classList.add('input-animate');
}

// --- Fetch user's devices and pick the first one ---
async function getDevicesForUser(userId) {
  const response = await fetch(`http://127.0.0.1:5000/api/devices?user_id=${userId}`);
  return await response.json();
}

// --- Fetch sensors for MCU ---
async function getSensorsForMCU(mcuId) {
  const response = await fetch(`http://127.0.0.1:5000/api/sensors?mcu_id=${mcuId}`);
  return await response.json();
}

// --- Get Latest Reading for Each Sensor ---
async function getLatestReading(sensorId) {
  const response = await fetch(`http://127.0.0.1:5000/api/sensor_readings?sensor_id=${sensorId}`);
  const data = await response.json();
  if (data.length > 0) return data[0].reading_value;
  return '--';
}

// Map dashboard names to screen IDs
const dashboardNames = {
  'Temperature Sensor': { id: 'temperature', input: () => tempInput.value.trim() },
  'Air Quality Sensor': { id: 'air-quality', input: () => airInput.value.trim() },
  'Light Sensor': { id: 'light', input: () => lightInput.value },
  'Water Tank 1st Floor': { id: 'water1', input: () => water1Input.value },
  'Water Tank 2nd Floor': { id: 'water2', input: () => water2Input.value }
};

async function updateRealTimeData() {
  if (!mcuId) return;
  try {
    const sensors = await getSensorsForMCU(mcuId);

    // Cache sensor_id for each sensor name
    sensorsByName = {};
    for (const sensor of sensors) {
      sensorsByName[sensor.sensor_name] = sensor.sensor_id;
      const dash = dashboardNames[sensor.sensor_name];
      if (!dash) continue;
      const reading = await getLatestReading(sensor.sensor_id);

      let displayValue = reading;
      if (dash.id === 'temperature') displayValue += ' °C';
      else if (dash.id === 'air-quality') displayValue += ' AQI';
      document.getElementById(dash.id).textContent = displayValue;
    }
  } catch (error) {
    console.log('Error fetching sensor data:', error);
  }
}

async function updateFromInput() {
  // Prepare setpoints array with sensor_id, name, value
  const setpoints = [];
  for (const [sensorName, dash] of Object.entries(dashboardNames)) {
    const value = dash.input();
    if (value !== '' && sensorsByName[sensorName]) {
      setpoints.push({
        sensor_id: sensorsByName[sensorName],
        name: sensorName.replace(' Sensor', ''), // For display, remove "Sensor" if present
        value: value
      });
    }
  }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/set_point', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ mcu_id: mcuId, user_id: userId, setpoints })
    });
    const data = await res.json();
    alert(data.message || 'Set points sent!');
  } catch (err) {
    alert('Error sending set points.');
  }

  tempInput.value = '';
  airInput.value = '';
  lightInput.value = '';
  water1Input.value = '';
  water2Input.value = '';
  updateBtn.disabled = true;
}

// --- Events ---
tempInput.addEventListener('input', (e) => { validateInputs(); animateInput(e.target); });
airInput.addEventListener('input', (e) => { validateInputs(); animateInput(e.target); });
lightInput.addEventListener('change', (e) => { validateInputs(); animateInput(e.target); });
water1Input.addEventListener('change', (e) => { validateInputs(); animateInput(e.target); });
water2Input.addEventListener('change', (e) => { validateInputs(); animateInput(e.target); });

// --- On page load: check login, get device, start data polling ---
window.onload = async function() {
  userId = localStorage.getItem('user_id');
  if (!userId) {
    window.location.href = "login.html";
    return;
  }
  const devices = await getDevicesForUser(userId);
  if (devices.length > 0) {
    mcuId = devices[0].mcu_id;
    setInterval(updateRealTimeData, 2000);
  } else {
    alert("No devices found for this user.");
  }
}
