 // Demo user database (username:password)
    const usersDB = {
      owner: 'owner123',
      cashier: 'cashier123'
    };

    let currentUser = null;
    let chart;

    function login() {
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;

      if (usersDB[username] && usersDB[username] === password) {
        currentUser = username;
        localStorage.setItem('currentUser', currentUser);
        document.getElementById('login-error').textContent = '';
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        document.getElementById('current-user').textContent = currentUser;
        loadSavedPayments();
      } else {
        document.getElementById('login-error').textContent = 'Invalid username or password.';
      }
    }

    function logout() {
      currentUser = null;
      localStorage.removeItem('currentUser');
      document.getElementById('app-content').style.display = 'none';
      document.getElementById('login-screen').style.display = 'block';
      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
      document.getElementById('payment-table').innerHTML = '';
      document.getElementById('money-count').textContent = '0';
      document.getElementById('people-count').textContent = '0';
      if(chart) chart.destroy();
    }

    function loadSavedPayments() {
      if (!currentUser) return;
      const saved = localStorage.getItem(`payments_${currentUser}`);
      if (saved) {
        const payments = JSON.parse(saved);
        document.getElementById('payment-table').innerHTML = '';
        payments.forEach(payment => addPaymentRow(payment.name, payment.amount, payment.date));
        updateTotals(payments);
        updateChart(payments);
      } else {
        // Clear table and counters if no data
        document.getElementById('payment-table').innerHTML = '';
        updateTotals([]);
        updateChart([]);
      }
    }

    function updateTotals(payments) {
      const totalMoney = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalPeople = payments.length;
      document.getElementById('money-count').textContent = totalMoney.toFixed(2);
      document.getElementById('people-count').textContent = totalPeople;
    }

    function addPayment() {
      if (!currentUser) return alert('Please log in first.');
      const name = document.getElementById('customer-name').value.trim();
      const amount = parseFloat(document.getElementById('amount').value);
      if (!name) return alert('Please enter customer name.');
      if (isNaN(amount)) return alert('Please enter a valid amount.');
      const date = new Date().toLocaleDateString();

      const payment = { name, amount, date };
      let payments = JSON.parse(localStorage.getItem(`payments_${currentUser}`)) || [];
      if (payments.length >= 100) return alert('Maximum 100 payments reached.');

      payments.push(payment);
      localStorage.setItem(`payments_${currentUser}`, JSON.stringify(payments));

      addPaymentRow(name, amount, date);
      updateTotals(payments);
      updateChart(payments);

      document.getElementById('customer-name').value = '';
      document.getElementById('amount').value = '';
    }

    function addPaymentRow(name, amount, date) {
      const table = document.getElementById('payment-table');
      const row = table.insertRow();
      row.insertCell(0).textContent = table.rows.length;
      row.insertCell(1).textContent = name;
      row.insertCell(2).textContent = `R${amount.toFixed(2)}`;
      row.insertCell(3).textContent = amount > 0 ? 'Paid' : 'Unpaid';
      row.insertCell(4).textContent = date;
    }

    function clearPayments() {
      if (!currentUser) return;
      if (!confirm('Are you sure you want to clear all payment data?')) return;
      localStorage.removeItem(`payments_${currentUser}`);
      document.getElementById('payment-table').innerHTML = '';
      updateTotals([]);
      updateChart([]);
    }

    function updateChart(payments) {
      const dailyTotals = {};
      payments.forEach(p => {
        dailyTotals[p.date] = (dailyTotals[p.date] || 0) + p.amount;
      });

      const labels = Object.keys(dailyTotals).sort((a,b) => new Date(a) - new Date(b));
      const data = labels.map(date => dailyTotals[date]);

      const ctx = document.getElementById('trendChart').getContext('2d');
      if (chart) chart.destroy();

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Total per Day (Rand)',
            data,
            backgroundColor: '#2ecc71',
            borderColor: '#27ae60',
            borderWidth: 1,
            barThickness: 10
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    function applyDateFilter() {
      if (!currentUser) return;

      const startDateInput = document.getElementById('filter-date-start').value;
      const endDateInput = document.getElementById('filter-date-end').value;
      let payments = JSON.parse(localStorage.getItem(`payments_${currentUser}`)) || [];

      if (startDateInput) {
        const start = new Date(startDateInput);
        payments = payments.filter(p => new Date(p.date) >= start);
      }
      if (endDateInput) {
        const end = new Date(endDateInput);
        payments = payments.filter(p => new Date(p.date) <= end);
      }

      // Update table
      const table = document.getElementById('payment-table');
      table.innerHTML = '';
      payments.forEach(p => addPaymentRow(p.name, p.amount, p.date));

      updateTotals(payments);
      updateChart(payments);
    }

    // On load: check if user already logged in
    window.onload = () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser && usersDB[savedUser]) {
        currentUser = savedUser;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        document.getElementById('current-user').textContent = currentUser;
        loadSavedPayments();
      }
    }