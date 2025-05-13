document.addEventListener('DOMContentLoaded', async () => { // async を追加
    const currentMonthYearElement = document.getElementById('current-month-year');
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const selectedDateValueElement = document.getElementById('selected-date-value');
    const sendDateButton = document.getElementById('send-date-button');

    // --- LIFF関連の要素 (任意) ---
    const liffStatusContainer = document.getElementById('liff-status');
    const liffStatusMessage = document.getElementById('liff-status-message');
    // --------------------------

    let currentDate = new Date();
    let currentSelectedDateObj = null;

    // ***** 重要: ここにご自身のLIFF IDを設定してください *****
    const MY_LIFF_ID = "2007408982-8W0x1kq3"; // 例: "1234567890-AbcdefgH"
    // *****************************************************

    // --- LIFF初期化処理 ---
    async function initializeLiff() {
        try {
            if (liffStatusContainer) liffStatusContainer.style.display = 'block';
            if (liffStatusMessage) liffStatusMessage.textContent = 'LIFF SDKを初期化中...';

            await liff.init({ liffId: MY_LIFF_ID });

            if (liffStatusMessage) liffStatusMessage.textContent = 'LIFF SDK初期化完了。';

            if (!liff.isLoggedIn()) {
                if (liffStatusMessage) liffStatusMessage.textContent = 'LINEにログインしていません。ログインします...';
                // 開発中は自動ログインをコメントアウトして、手動でログインを試すこともできます
                // window.alert("LINEにログインしていません。LIFFを開き直してログインしてください。");
                liff.login(); // ログインしていなければログインページにリダイレクト
                return; // ログインリダイレクト後は処理を中断
            } else {
                if (liffStatusMessage) liffStatusMessage.textContent = `LINEログイン済み (User ID: ${liff.getDecodedIDToken().sub})`;
            }

            // カレンダーの初期表示
            renderCalendar(currentDate);

        } catch (error) {
            console.error("LIFF Initialization failed", error);
            if (liffStatusMessage) liffStatusMessage.textContent = `LIFF初期化エラー: ${error.message}`;
            selectedDateValueElement.textContent = "LIFFの初期化に失敗しました。";
            // LIFFが使えない場合でもカレンダーは表示したいなら、ここでrenderCalendarを呼ぶ
            // renderCalendar(currentDate);
            // ただし、送信機能は動作しない
            sendDateButton.disabled = true;
            sendDateButton.textContent = "LIFFエラー";
        }
    }
    // --------------------------

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

                        const previouslySelectedCell = calendarBody.querySelector('.selected');
                        if (previouslySelectedCell) {
                            previouslySelectedCell.classList.remove('selected');
                        }

                        cell.classList.add('selected');
                        currentSelectedDateObj = cellDate;
                        const displayDate = `${year}年${month + 1}月${dateCounter}日`;
                        selectedDateValueElement.textContent = displayDate;
                        console.log('Selected Date:', currentSelectedDateObj.toISOString());

                        // 日付が選択されたら送信ボタンを有効化
                        if (liff.isLoggedIn()) { // LIFFが利用可能な場合のみ
                            sendDateButton.disabled = false;
                        }
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

    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    // --- 送信ボタンの処理 ---
    sendDateButton.addEventListener('click', async () => {
        if (!currentSelectedDateObj) {
            alert("まず日付を選択してください。");
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

        const messageText = `選択された日時: ${year}年${month}月${day}日 (${dayOfWeek}曜日)`;

        try {
            if (liff.isInClient()) { // LINEアプリ内で開かれているか確認
                await liff.sendMessages([
                    {
                        type: 'text',
                        text: messageText
                    }
                ]);
                // 送信後、LIFFを閉じる
                liff.closeWindow();
            } else {
                // LINEアプリ外 (外部ブラウザなど) で開かれている場合のフォールバック
                // このサンプルではアラートを表示するのみ
                alert(`以下のメッセージをLINEで送信します (実際には送信されません):\n${messageText}\n\nLINEアプリ内で開いてください。`);
                // 開発用にコンソールにも出力
                console.log("Message to send (not in LINE client):", messageText);
            }
        } catch (error) {
            console.error("Message sending failed", error);
            alert(`メッセージの送信に失敗しました: ${error.message}`);
        }
    });
    // ------------------------

    // LIFF初期化を実行
    await initializeLiff(); // async関数内でawaitを使う
    // initializeLiff().then(() => {
    //     // カレンダー初期表示はinitializeLiff内で行う
    // }).catch(error => {
    //     console.error("Error during LIFF setup:", error);
    // });

    // 初期状態では送信ボタンを無効化
    sendDateButton.disabled = true;
});
