document.addEventListener('DOMContentLoaded', function () {
  var today = new Date();

  function formatDate(date) {
    var day = date.getDate();
    var month = date.getMonth() + 1; // Январь это 0!
    var year = date.getFullYear();

    if (day < 10) {
      day = '0' + day;
    }

    if (month < 10) {
      month = '0' + month;
    }

    return day + '.' + month + '.' + year;
  }

  // Используем форматированный вариант сегодняшней даты
  var todayDateString = formatDate(today);

  var maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 7);

  var minDate = new Date(today);
  minDate.setDate(today.getDate() - 7);

  var sessionsTimes = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  function loadDates() {
    var dateSelect = document.getElementById('date-select');
    for (var d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      var option = document.createElement('option');
      option.value = formatDate(d);
      option.textContent = formatDate(d);
      dateSelect.appendChild(option);
    }
    // Устанавливаем текущую дату по умолчанию
    dateSelect.value = todayDateString;
  }

  function parseDate(dateString) {
    var parts = dateString.split('.');
    // Преобразуем дату из формата дд.мм.гггг в объект Date
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  function toggleBooking(date, time, seat) {
    var bookings = JSON.parse(localStorage.getItem('bookings')) || {};
    var key = date + '-' + time;

    if (!bookings[key]) {
      bookings[key] = [];
    }

    if (bookings[key].indexOf(seat) !== -1) {
      bookings[key] = bookings[key].filter(function (s) {
        return s !== seat;
      });
    } else {
      bookings[key].push(seat);
    }

    localStorage.setItem('bookings', JSON.stringify(bookings));
  }

  function showConfirmationModal(date, time, row, seat, seatDiv) {
    var modal = document.getElementById('modal');
    var modalText = document.getElementById('modal-text');
    var confirmBtn = document.getElementById('confirm-btn');
    var cancelBtn = document.getElementById('cancel-btn');

    modalText.textContent = 'Вы выбрали Ряд ' + row + ', Место ' + seat + '. Подтвердить бронирование?';
    modal.style.display = 'block';

    confirmBtn.onclick = function () {
      toggleBooking(date, time, row + '-' + seat);
      seatDiv.classList.add('booked');
      seatDiv.classList.remove('available');
      modal.style.display = 'none';
    };

    cancelBtn.onclick = function () {
      modal.style.display = 'none';
    };

    window.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };

    var closeBtn = document.getElementsByClassName('close')[0];
    closeBtn.onclick = function () {
      modal.style.display = 'none';
    };
  }

  function showCancellationModal(date, time, row, seat, seatDiv) {
    var modal = document.getElementById('modal');
    var modalText = document.getElementById('modal-text');
    var confirmBtn = document.getElementById('confirm-btn');
    var cancelBtn = document.getElementById('cancel-btn');

    modalText.textContent = 'Вы выбрали Ряд ' + row + ', Место ' + seat + '. Отменить бронирование?';
    modal.style.display = 'block';

    confirmBtn.onclick = function () {
      toggleBooking(date, time, row + '-' + seat);
      seatDiv.classList.remove('booked');
      seatDiv.classList.add('available');
      modal.style.display = 'none';
    };

    cancelBtn.onclick = function () {
      modal.style.display = 'none';
    };

    window.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };

    var closeBtn = document.getElementsByClassName('close')[0];
    closeBtn.onclick = function () {
      modal.style.display = 'none';
    };
  }

  function loadSeats(date, time, isPastSession) {
    var seatsDiv = document.getElementById('seats');
    seatsDiv.innerHTML = '';

    var rows = 5;
    var cols = 8;

    var bookings = JSON.parse(localStorage.getItem('bookings')) || {};
    var key = date + '-' + time;

    for (var i = 0; i < rows; i += 1) {
      var rowDiv = document.createElement('div');
      rowDiv.classList.add('seat-row');
      var rowLabel = document.createElement('div');
      rowLabel.textContent = 'Ряд ' + (i + 1);
      rowLabel.classList.add('row-label');
      rowDiv.appendChild(rowLabel);
      for (var j = 0; j < cols; j += 1) {
        (function (i, j) {
          var seatDiv = document.createElement('div');
          seatDiv.textContent = (j + 1).toString();
          var isBooked = bookings[key] && bookings[key].indexOf((i + 1) + '-' + (j + 1)) !== -1;
          seatDiv.classList.add(isBooked ? 'booked' : 'available');

          if (isPastSession) {
            seatDiv.classList.add(isBooked ? 'archived-booked' : 'archived-available');
          } else {
            seatDiv.addEventListener('click', function () {
              if (seatDiv.classList.contains('booked')) {
                showCancellationModal(date, time, i + 1, j + 1, seatDiv);
              } else {
                showConfirmationModal(date, time, i + 1, j + 1, seatDiv);
              }
            });
          }

          rowDiv.appendChild(seatDiv);
        })(i, j);
      }
      seatsDiv.appendChild(rowDiv);
    }
  }

  function highlightSelectedSession(selectedSessionDiv) {
    var sessionDivs = document.querySelectorAll('#sessions div');
    sessionDivs.forEach(function (div) {
      div.classList.remove('selected');
    });
    selectedSessionDiv.classList.add('selected');
  }

  function loadSessions() {
    var selectedDate = document.getElementById('date-select').value;
    var sessionsDiv = document.getElementById('sessions');
    sessionsDiv.innerHTML = '';

    var selectedDateObj = parseDate(selectedDate);
    var isPastDate = selectedDateObj < today;

    sessionsTimes.forEach(function (time) {
      var sessionDiv = document.createElement('div');
      sessionDiv.textContent = time;

      var sessionDateTime = new Date(selectedDateObj);
      var timeParts = time.split(':');
      sessionDateTime.setHours(timeParts[0]);
      sessionDateTime.setMinutes(timeParts[1]);
      var isPastSession = sessionDateTime < today;

      if (isPastSession) {
        sessionDiv.classList.add('archived');
      } else {
        sessionDiv.classList.add('available');
      }

      sessionDiv.addEventListener('click', function () {
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
