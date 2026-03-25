// Alternative XMLHttpRequest version for testing
function submitFormXHR() {
  const name = document.getElementById('inp-name').value.trim();
  const email = document.getElementById('inp-email').value.trim();
  const category = document.getElementById('inp-category').value;
  const message = document.getElementById('inp-message').value.trim();

  if (!name || !email || !selectedRating || !message) {
    alert('Please fill all required fields');
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:3000/api/feedback', true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onload = function() {
    if (xhr.status === 201) {
      const data = JSON.parse(xhr.responseText);
      alert('SUCCESS: ' + data.message);
      resetForm();
    } else {
      alert('ERROR: ' + xhr.status + ' - ' + xhr.responseText);
    }
  };

  xhr.onerror = function() {
    alert('NETWORK ERROR: Cannot connect to server');
  };

  xhr.timeout = 5000;
  xhr.ontimeout = function() {
    alert('TIMEOUT: Server took too long to respond');
  };

  const data = JSON.stringify({
    name, email, category, rating: selectedRating, message
  });

  xhr.send(data);
}