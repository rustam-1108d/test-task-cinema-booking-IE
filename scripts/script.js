document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();

  function formatDate(date) {
    let day = date.getDate();
    let month = date.getMonth() + 1; // Январь это 0!
    const year = date.getFullYear();

    if (day < 10) {
      day = `0${day}`;
    }

    if (month < 10) {
      month = `0${month}`;
    }

    return `${day}.${month}.${year}`;
  }

  // Используем форматированный вариант сегодняшней даты
  const todayDateString = formatDate(today);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 7);

  const minDate = new Date(today);
  minDate.setDate(today.getDate() - 7);

  const sessionsTimes = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  function loadDates() {
    const dateSelect = document.getElementById('date-select');
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const option = document.createElement('option');
      option.value = formatDate(d);
      option.textContent = formatDate(d);
      dateSelect.appendChild(option);
    }
    // Устанавливаем текущую дату по умолчанию
    dateSelect.value = todayDateString;
  }

  function parseDate(dateString) {
    const parts = dateString.split('.');
    // Преобразуем дату из формата дд.мм.гггг в объект Date
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  function toggleBooking(date, time, seat) {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || {};
    const key = `${date}-${time}`;

    if (!bookings[key]) {
      bookings[key] = [];
    }

    if (bookings[key].includes(seat)) {
      bookings[key] = bookings[key].filter((s) => s !== seat);
    } else {
      bookings[key].push(seat);
    }

    localStorage.setItem('bookings', JSON.stringify(bookings));
  }

  function showConfirmationModal(date, time, row, seat, seatDiv) {
    const modal = document.getElementById('modal');
    const modalText = document.getElementById('modal-text');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    modalText.textContent = `Вы выбрали Ряд ${row}, Место ${seat}. Подтвердить бронирование?`;
    modal.style.display = 'block';

    confirmBtn.onclick = () => {
      toggleBooking(date, time, `${row}-${seat}`);
      seatDiv.classList.add('booked');
      seatDiv.classList.remove('available');
      modal.style.display = 'none';
    };

    cancelBtn.onclick = () => {
      modal.style.display = 'none';
    };

    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };

    const closeBtn = document.getElementsByClassName('close')[0];
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }

  function showCancellationModal(date, time, row, seat, seatDiv) {
    const modal = document.getElementById('modal');
    const modalText = document.getElementById('modal-text');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    modalText.textContent = `Вы выбрали Ряд ${row}, Место ${seat}. Отменить бронирование?`;
    modal.style.display = 'block';

    confirmBtn.onclick = () => {
      toggleBooking(date, time, `${row}-${seat}`);
      seatDiv.classList.remove('booked');
      seatDiv.classList.add('available');
      modal.style.display = 'none';
    };

    cancelBtn.onclick = () => {
      modal.style.display = 'none';
    };

    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };

    const closeBtn = document.getElementsByClassName('close')[0];
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }

  function loadSeats(date, time, isPastSession) {
    const seatsDiv = document.getElementById('seats');
    seatsDiv.innerHTML = '';

    const rows = 5;
    const cols = 8;

    const bookings = JSON.parse(localStorage.getItem('bookings')) || {};
    const key = `${date}-${time}`;

    for (let i = 0; i < rows; i += 1) {
      const rowDiv = document.createElement('div');
      rowDiv.classList.add('seat-row');
      const rowLabel = document.createElement('div');
      rowLabel.textContent = `Ряд ${i + 1}`;
      rowLabel.classList.add('row-label');
      rowDiv.appendChild(rowLabel);
      for (let j = 0; j < cols; j += 1) {
        const seatDiv = document.createElement('div');
        seatDiv.textContent = `${j + 1}`;
        const isBooked = bookings[key] && bookings[key].includes(`${i + 1}-${j + 1}`);
        seatDiv.classList.add(isBooked ? 'booked' : 'available');

        if (isPastSession) {
          seatDiv.classList.add(isBooked ? 'archived-booked' : 'archived-available');
        } else {
          seatDiv.addEventListener('click', () => {
            if (seatDiv.classList.contains('booked')) {
              showCancellationModal(date, time, i + 1, j + 1, seatDiv);
            } else {
              showConfirmationModal(date, time, i + 1, j + 1, seatDiv);
            }
          });
        }

        rowDiv.appendChild(seatDiv);
      }
      seatsDiv.appendChild(rowDiv);
    }
  }

  function highlightSelectedSession(selectedSessionDiv) {
    const sessionDivs = document.querySelectorAll('#sessions div');
    sessionDivs.forEach((div) => {
      div.classList.remove('selected');
    });
    selectedSessionDiv.classList.add('selected');
  }

  function loadSessions() {
    const selectedDate = document.getElementById('date-select').value;
    const sessionsDiv = document.getElementById('sessions');
    sessionsDiv.innerHTML = '';

    const selectedDateObj = parseDate(selectedDate);
    // const isPastDate = selectedDateObj < today;

    sessionsTimes.forEach((time) => {
      const sessionDiv = document.createElement('div');
      sessionDiv.textContent = time;

      const sessionDateTime = new Date(selectedDateObj);
      const [hours, minutes] = time.split(':');
      sessionDateTime.setHours(hours);
      sessionDateTime.setMinutes(minutes);
      const isPastSession = sessionDateTime < today;

      if (isPastSession) {
        sessionDiv.classList.add('archived');
      } else {
        sessionDiv.classList.add('available');
      }

      sessionDiv.addEventListener('click', () => {
        loadSeats(selectedDate, time, isPastSession);
        highlightSelectedSession(sessionDiv);
      });

      sessionsDiv.appendChild(sessionDiv);
    });

    // Очистка контейнера мест при смене даты
    document.getElementById('seats').innerHTML = '';
  }

  function init() {
    loadDates();
    document.getElementById('date-select').addEventListener('change', loadSessions);
    loadSessions();
  }

  init();
});
