document.addEventListener('DOMContentLoaded', () => {
    const currentMonthYearElement = document.getElementById('current-month-year');
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const selectedDateValueElement = document.getElementById('selected-date-value');

    let currentDate = new Date(); // 現在表示しているカレンダーの基準日
    let currentSelectedDateObj = null; // 選択されたDateオブジェクト

    function renderCalendar(dateToDisplay) {
        calendarBody.innerHTML = ''; // カレンダーをクリア
        const year = dateToDisplay.getFullYear();
        const month = dateToDisplay.getMonth(); // 0-indexed (0: January, 11: December)

        currentMonthYearElement.textContent = `${year}年 ${month + 1}月`;

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0); // その月の最終日
        const daysInMonth = lastDayOfMonth.getDate();
        const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) - 6 (Saturday)

        const today = new Date(); // 今日の日付を取得 (比較用)

        let dateCounter = 1;
        for (let i = 0; i < 6; i++) { // カレンダーは最大6行
            if (dateCounter > daysInMonth && i > 0 && calendarBody.lastChild.querySelectorAll('td:not(.empty)').length === 0) {
                // 前の行が全てemptyで、かつ日付が全て表示済みなら、それ以上行を追加しない
                // ただし、これは月の表示が5行で終わる場合に最終行が空になるのを防ぐ意図だが、
                // 日付が残っていてもループを抜けてしまう可能性があるので、単純に6行表示する。
                // より厳密にするなら、生成後に最後の空行を削除するなどの処理が必要。
                // ここではシンプルに最大6行表示とする。
            }

            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) { // 7日 (曜日)
                const cell = document.createElement('td');
                if (i === 0 && j < firstDayOfWeek) {
                    // 月の最初の週の、1日より前の空白セル
                    cell.classList.add('empty');
                } else if (dateCounter > daysInMonth) {
                    // 月の最後の週の、最終日より後の空白セル
                    cell.classList.add('empty');
                } else {
                    cell.textContent = dateCounter;
                    const cellDate = new Date(year, month, dateCounter);

                    // 今日の日付をマーク
                    if (dateCounter === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                        cell.classList.add('today');
                    }

                    // 以前に選択された日付と同じであればマーク
                    if (currentSelectedDateObj &&
                        dateCounter === currentSelectedDateObj.getDate() &&
                        month === currentSelectedDateObj.getMonth() &&
                        year === currentSelectedDateObj.getFullYear()) {
                        cell.classList.add('selected');
                    }

                    cell.addEventListener('click', () => {
                        if (cell.classList.contains('empty')) return; // 空白セルは無視

                        // 以前に選択されたセルのスタイルをクリア
                        const previouslySelectedCell = calendarBody.querySelector('.selected');
                        if (previouslySelectedCell) {
                            previouslySelectedCell.classList.remove('selected');
                        }

                        // 新しいセルを選択状態にする
                        cell.classList.add('selected');
                        currentSelectedDateObj = cellDate; // Dateオブジェクトを保持
                        selectedDateValueElement.textContent = `${year}年${month + 1}月${dateCounter}日`;

                        // (将来のLIFF連携用) 選択された日時をコンソールに出力
                        console.log('Selected Date:', currentSelectedDateObj.toISOString());
                    });
                    dateCounter++;
                }
                row.appendChild(cell);
            }
            calendarBody.appendChild(row);

            // もしこの行が全てemptyで、かつ日付が全て表示済みなら、これ以上行は不要なのでループを抜ける
            // (月の表示が4行や5行で終わる場合のため)
            if (dateCounter > daysInMonth && row.querySelectorAll('td:not(.empty)').length === 0) {
                row.remove(); // 追加したばかりの全てemptyの行を削除
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

    // 初期カレンダー表示
    renderCalendar(currentDate);
});