document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const loginError = document.getElementById('login-error');
  loginError.style.display = 'none';

  try {
    const res = await fetch('http://127.0.0.1:5000/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('user_id', data.user_id);
      window.location.href = "index.html";
    } else {
      loginError.textContent = data.error || "Login failed";
      loginError.style.display = 'block';
    }
  } catch (err) {
    loginError.textContent = "Server error. Try again.";
    loginError.style.display = 'block';
  }
});
