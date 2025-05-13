document.addEventListener('DOMContentLoaded', async () => {
    const currentMonthYearElement = document.getElementById('current-month-year');
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const selectedDatetimeValueElement = document.getElementById('selected-datetime-value'); // ID変更
    const sendDatetimeButton = document.getElementById('send-datetime-button'); // ID変更
    const timeSelectionContainer = document.getElementById('time-selection-container');
    const timeSlotsDiv = document.getElementById('time-slots');

    const liffStatusContainer = document.getElementById('liff-status');
    const liffStatusMessage = document.getElementById('liff-status-message');

    let currentDate = new Date();
    let currentSelectedDateObj = null;
    let currentSelectedTimeStr = null; // 選択された時間を保持 (例: "10:30")

    const MY_LIFF_ID = "2007408982-8W0x1kq3"; // ★★★ ご自身のLIFF IDに置き換えてください ★★★

    async function initializeLiff() {
        try {
            if (liffStatusContainer) liffStatusContainer.style.display = 'block';
            if (liffStatusMessage) liffStatusMessage.textContent = 'LIFF SDKを初期化中...';
            await liff.init({ liffId: MY_LIFF_ID });
            if (liffStatusMessage) liffStatusMessage.textContent = 'LIFF SDK初期化完了。';

            if (!liff.isLoggedIn()) {
                if (liffStatusMessage) liffStatusMessage.textContent = 'LINEにログインしていません。ログインします...';
                liff.login();
                return;
            } else {
                if (liffStatusMessage) liffStatusMessage.textContent = `LINEログイン済み`;
            }
            renderCalendar(currentDate);
        } catch (error) {
            console.error("LIFF Initialization failed", error);
            if (liffStatusMessage) liffStatusMessage.textContent = `LIFF初期化エラー: ${error.message}`;
            selectedDatetimeValueElement.textContent = "LIFFの初期化に失敗しました。";
            sendDatetimeButton.disabled = true;
            sendDatetimeButton.textContent = "LIFFエラー";
        }
    }

    function renderCalendar(dateToDisplay) {
        calendarBody.innerHTML = '';
        const year = dateToDisplay.getFullYear();
        const month = dateToDisplay.getMonth();
        currentMonthYearElement.textContent = `${year}年 ${month + 1}月`;

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const today = new Date();

        let dateCounter = 1;
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                if (i === 0 && j < firstDayOfWeek) {
                    cell.classList.add('empty');
                } else if (dateCounter > daysInMonth) {
                    cell.classList.add('empty');
                } else {
                    cell.textContent = dateCounter;
                    const cellDate = new Date(year, month, dateCounter);

                    if (dateCounter === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                        cell.classList.add('today');
                    }

                    if (currentSelectedDateObj &&
                        dateCounter === currentSelectedDateObj.getDate() &&
                        month === currentSelectedDateObj.getMonth() &&
                        year === currentSelectedDateObj.getFullYear()) {
                        cell.classList.add('selected');
                    }

                    cell.addEventListener('click', () => {
                        if (cell.classList.contains('empty')) return;

                        // 日付の選択状態を更新
                        const previouslySelectedCell = calendarBody.querySelector('.selected');
                        if (previouslySelectedCell) {
                            previouslySelectedCell.classList.remove('selected');
                        }
                        cell.classList.add('selected');
                        currentSelectedDateObj = cellDate;

                        // 時間選択をリセットし、時間選択UIを表示
                        currentSelectedTimeStr = null;
                        updateSelectedDatetimeDisplay(); // まず日付のみで更新
                        renderTimeSlots();
                        timeSelectionContainer.style.display = 'block';
                        sendDatetimeButton.disabled = true; // 時間が選択されるまで送信不可
                    });
                    dateCounter++;
                }
                row.appendChild(cell);
            }
            calendarBody.appendChild(row);
            if (dateCounter > daysInMonth && row.querySelectorAll('td:not(.empty)').length === 0) {
                row.remove();
                break;
            }
        }
    }

    function renderTimeSlots() {
        timeSlotsDiv.innerHTML = ''; // 既存の時間スロットをクリア
        const startTime = 10 * 60; // 10:00 を分で表現
        const endTime = 18 * 60;   // 18:00 を分で表現
        const interval = 30;       // 30分間隔

        for (let minutes = startTime; minutes <= endTime; minutes += interval) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

            const button = document.createElement('button');
            button.classList.add('time-slot-button');
            button.textContent = timeString;
            button.dataset.time = timeString; // data属性に時間を格納

            if (timeString === currentSelectedTimeStr) {
                button.classList.add('selected-time');
            }

            button.addEventListener('click', () => {
                // 以前選択された時間ボタンのスタイルをクリア
                const previouslySelectedTimeButton = timeSlotsDiv.querySelector('.selected-time');
                if (previouslySelectedTimeButton) {
                    previouslySelectedTimeButton.classList.remove('selected-time');
                }
                // 新しい時間ボタンを選択状態にする
                button.classList.add('selected-time');
                currentSelectedTimeStr = timeString;
                updateSelectedDatetimeDisplay();

                // 日付と時間が両方選択されたら送信ボタンを有効化
                if (currentSelectedDateObj && currentSelectedTimeStr && liff.isLoggedIn()) {
                    sendDatetimeButton.disabled = false;
                }
            });
            timeSlotsDiv.appendChild(button);
        }
    }

    function updateSelectedDatetimeDisplay() {
        if (currentSelectedDateObj) {
            const year = currentSelectedDateObj.getFullYear();
            const month = currentSelectedDateObj.getMonth() + 1;
            const day = currentSelectedDateObj.getDate();
            let displayText = `${year}年${month}月${day}日`;
            if (currentSelectedTimeStr) {
                displayText += ` ${currentSelectedTimeStr}`;
            }
            selectedDatetimeValueElement.textContent = displayText;
        } else {
            selectedDatetimeValueElement.textContent = "未選択";
        }
    }


    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
        timeSelectionContainer.style.display = 'none'; // 月移動時は時間選択を隠す
        currentSelectedDateObj = null; // 選択をリセット
        currentSelectedTimeStr = null;
        updateSelectedDatetimeDisplay();
        sendDatetimeButton.disabled = true;
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
        timeSelectionContainer.style.display = 'none'; // 月移動時は時間選択を隠す
        currentSelectedDateObj = null; // 選択をリセット
        currentSelectedTimeStr = null;
        updateSelectedDatetimeDisplay();
        sendDatetimeButton.disabled = true;
    });

    sendDatetimeButton.addEventListener('click', async () => {
        if (!currentSelectedDateObj || !currentSelectedTimeStr) {
            alert("日付と時間を選択してください。");
            return;
        }
        if (!liff.isLoggedIn()) {
            alert("LINEにログインしていません。");
            return;
        }

        const year = currentSelectedDateObj.getFullYear();
        const month = currentSelectedDateObj.getMonth() + 1;
        const day = currentSelectedDateObj.getDate();
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][currentSelectedDateObj.getDay()];

        const messageText = `選択された日時: ${year}年${month}月${day}日(${dayOfWeek}) ${currentSelectedTimeStr}`;

        try {
            if (liff.isInClient()) {
                await liff.sendMessages([
                    {
                        type: 'text',
                        text: messageText
                    }
                ]);
                liff.closeWindow();
            } else {
                alert(`以下のメッセージをLINEで送信します (実際には送信されません):\n${messageText}\n\nLINEアプリ内で開いてください。`);
                console.log("Message to send (not in LINE client):", messageText);
            }
        } catch (error) {
            console.error("Message sending failed", error);
            alert(`メッセージの送信に失敗しました: ${error.message}`);
        }
    });

    // LIFF初期化を実行
    await initializeLiff();

    // 初期状態では送信ボタンを無効化
    sendDatetimeButton.disabled = true;
    // 初期表示の更新
    updateSelectedDatetimeDisplay();
});
