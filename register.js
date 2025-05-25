document.getElementById('register-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const email = document.getElementById('register-email').value.trim();

  const errMsg = document.getElementById('register-error');
  const succMsg = document.getElementById('register-success');
  errMsg.style.display = 'none';
  succMsg.style.display = 'none';

  try {
    const res = await fetch('http://127.0.0.1:5000/api/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, password, email })
    });
    const data = await res.json();
    if (res.ok) {
      succMsg.textContent = "Registration successful! You can now login.";
      succMsg.style.display = 'block';
    } else {
      errMsg.textContent = data.error || "Registration failed.";
      errMsg.style.display = 'block';
    }
  } catch (err) {
    errMsg.textContent = "Server error. Try again.";
    errMsg.style.display = 'block';
  }
});
