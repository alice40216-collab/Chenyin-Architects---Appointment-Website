(() => {
  const FORM_ENDPOINT = "https://formspree.io/f/mrpgwjgl";
  const form = document.querySelector("#booking-form");
  const applicantInput = document.querySelector("#applicant");
  const phoneInput = document.querySelector("#phone");
  const addressInput = document.querySelector("#address");
  const lineIdInput = document.querySelector("#line-id");
  const dateInput = document.querySelector("#booking-date");
  const monthLabel = document.querySelector("#calendar-month");
  const calendarDays = document.querySelector("#calendar-days");
  const selectedDateLabel = document.querySelector("#selected-date");
  const previousMonthButton = document.querySelector("#previous-month");
  const nextMonthButton = document.querySelector("#next-month");
  const projectNote = document.querySelector("#project-note");
  const minimumBookingNote = document.querySelector("#minimum-booking-note");
  const timeSelect = document.querySelector("#appointment-time");
  const dialog = document.querySelector("#review-dialog");
  const closeDialogButton = document.querySelector("#close-dialog");
  const summary = document.querySelector("#booking-summary");
  const dialogKicker = document.querySelector("#dialog-kicker");
  const dialogTitle = document.querySelector("#review-title");
  const dialogIntro = document.querySelector("#dialog-intro");
  const dialogActions = document.querySelector("#dialog-actions");
  const successPanel = document.querySelector("#success-panel");
  const sendBookingButton = document.querySelector("#send-booking");
  const sendBookingLabel = document.querySelector("#send-booking-label");
  const copyBooking = document.querySelector("#copy-booking");
  const dialogStatus = document.querySelector("#dialog-status");
  const formStatus = document.querySelector("#form-status");

  const LEAD_DAYS = 7;
  const today = startOfDay(new Date());
  const minimumBookingDate = new Date(today);
  minimumBookingDate.setDate(minimumBookingDate.getDate() + LEAD_DAYS);
  let viewDate = new Date(minimumBookingDate.getFullYear(), minimumBookingDate.getMonth(), 1);
  let selectedDate = null;
  let lastFocusedElement = null;
  let preparedText = "";
  let preparedData = null;
  let sending = false;

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(date);
  }

  function sameDate(first, second) {
    return first && second && toISODate(first) === toISODate(second);
  }

  function renderCalendar() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    monthLabel.textContent = `${year}年${month + 1}月`;
    calendarDays.replaceChildren();

    const firstWeekday = new Date(year, month, 1).getDay();
    const gridStart = new Date(year, month, 1 - firstWeekday);

    for (let index = 0; index < 42; index += 1) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day";
      button.textContent = String(day.getDate());
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", formatDate(day));

      if (day.getMonth() !== month) button.classList.add("outside");
      if (sameDate(day, today)) {
        button.classList.add("today");
        button.setAttribute("aria-current", "date");
      }
      if (sameDate(day, selectedDate)) {
        button.classList.add("selected");
        button.setAttribute("aria-selected", "true");
      }
      if (day < minimumBookingDate) {
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
      }

      button.addEventListener("click", () => selectDate(day));
      calendarDays.append(button);
    }

    const earliestMonth = new Date(minimumBookingDate.getFullYear(), minimumBookingDate.getMonth(), 1);
    previousMonthButton.disabled = viewDate <= earliestMonth;
  }

  function selectDate(date) {
    if (startOfDay(date) < minimumBookingDate) return;
    selectedDate = startOfDay(date);
    viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    dateInput.value = toISODate(selectedDate);
    selectedDateLabel.textContent = formatDate(selectedDate);
    clearError(dateInput, "booking-date-error");
    renderCalendar();
  }

  function moveMonth(amount) {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + amount, 1);
    renderCalendar();
  }

  function setError(input, errorId, message) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", errorId);
    document.getElementById(errorId).textContent = message;
  }

  function clearError(input, errorId) {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    document.getElementById(errorId).textContent = "";
  }

  function validate() {
    let valid = true;
    const checks = [
      [applicantInput, "applicant-error", "請輸入申請人名稱。"],
      [phoneInput, "phone-error", "請輸入申請人聯絡電話。"],
      [addressInput, "address-error", "請輸入完整申請地址。"],
    ];

    checks.forEach(([input, errorId, message]) => {
      if (!input.value.trim()) {
        setError(input, errorId, message);
        valid = false;
      } else {
        clearError(input, errorId);
      }
    });

    const phoneDigits = phoneInput.value.replace(/\D/g, "");
    if (phoneInput.value.trim() && (phoneDigits.length < 8 || phoneDigits.length > 15)) {
      setError(phoneInput, "phone-error", "請輸入可聯絡的電話號碼。" );
      valid = false;
    }

    if (!selectedDate) {
      setError(dateInput, "booking-date-error", "請選擇預約日期。" );
      valid = false;
    } else if (selectedDate < minimumBookingDate) {
      setError(dateInput, "booking-date-error", `請選擇 ${formatDate(minimumBookingDate)} 或之後的日期。`);
      valid = false;
    } else {
      clearError(dateInput, "booking-date-error");
    }

    const timeError = document.querySelector("#time-error");
    if (!timeSelect.value) {
      timeError.textContent = "請選擇一個預約時段。";
      timeSelect.setAttribute("aria-invalid", "true");
      valid = false;
    } else {
      timeError.textContent = "";
      timeSelect.removeAttribute("aria-invalid");
    }

    if (!valid) {
      formStatus.textContent = "預約資料尚未完整，請檢查標示的欄位。";
      const firstInvalid = form.querySelector('[aria-invalid="true"]') || document.querySelector("#time-label");
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (firstInvalid?.focus && firstInvalid !== dateInput) firstInvalid.focus({ preventScroll: true });
      return null;
    }

    formStatus.textContent = "";
    return {
      applicant: applicantInput.value.trim(),
      phone: phoneInput.value.trim(),
      lineId: lineIdInput.value.trim(),
      address: addressInput.value.trim(),
      date: formatDate(selectedDate),
      dateISO: dateInput.value,
      time: timeSelect.value,
    };
  }

  function bookingText(data) {
    return [
      "宸胤建築師事務所｜線上諮詢及現勘安排申請",
      "",
      `申請人名稱：${data.applicant}`,
      `申請人聯絡電話：${data.phone}`,
      `申請地址：${data.address}`,
      `預約日期：${data.date}`,
      `預約時段：${data.time}`,
      `申請人 LINE ID：${data.lineId || "未提供"}`,
      "",
      "備註：本所將先進行線上諮詢，實際現勘時間以事務所確認通知為準。",
    ].join("\n");
  }

  function openReview(data) {
    const entries = [
      ["申請人名稱", data.applicant],
      ["聯絡電話", data.phone],
      ["申請地址", data.address],
      ["預約日期", data.date],
      ["預約時段", data.time],
      ["LINE ID", data.lineId || "未提供"],
    ];

    summary.replaceChildren();
    entries.forEach(([term, value]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dd.textContent = value;
      row.append(dt, dd);
      summary.append(row);
    });

    preparedData = data;
    preparedText = bookingText(data);
    dialogKicker.textContent = "FINAL CHECK";
    dialogTitle.textContent = "確認諮詢與現勘安排資料";
    dialogIntro.textContent = "請確認以下資訊。點選送出後，申請資料將直接送達本所信箱。";
    summary.hidden = false;
    successPanel.hidden = true;
    dialogActions.hidden = false;
    sendBookingButton.disabled = false;
    sendBookingLabel.textContent = "確認並送出";
    dialogStatus.classList.remove("is-error");
    dialogStatus.textContent = "";
    lastFocusedElement = document.activeElement;
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    closeDialogButton.focus();
  }

  function closeReview() {
    if (sending) return;
    dialog.hidden = true;
    document.body.style.overflow = "";
    lastFocusedElement?.focus();
  }

  async function copyPreparedText() {
    try {
      await navigator.clipboard.writeText(preparedText);
      dialogStatus.classList.remove("is-error");
      dialogStatus.textContent = "預約內容已複製。";
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = preparedText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      dialogStatus.classList.remove("is-error");
      dialogStatus.textContent = "預約內容已複製。";
    }
  }

  function resetFormAfterSuccess() {
    form.reset();
    selectedDate = null;
    dateInput.value = "";
    selectedDateLabel.textContent = "尚未選擇日期";
    projectNote.hidden = true;
    viewDate = new Date(minimumBookingDate.getFullYear(), minimumBookingDate.getMonth(), 1);
    renderCalendar();
  }

  async function submitBooking() {
    if (sending || !preparedData) return;

    sending = true;
    sendBookingButton.disabled = true;
    sendBookingLabel.textContent = "送出中…";
    dialogStatus.classList.remove("is-error");
    dialogStatus.textContent = "正在送出預約資料，請稍候。";

    const payload = new FormData(form);
    payload.set("subject", `線上諮詢及現勘安排申請｜${preparedData.applicant}｜${preparedData.dateISO}`);
    payload.set("name", preparedData.applicant);
    payload.set("phone", preparedData.phone);
    payload.set("address", preparedData.address);
    payload.set("appointment_date", preparedData.date);
    payload.set("appointment_time", preparedData.time);
    payload.set("line_id", preparedData.lineId || "未提供");

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: payload,
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("送出次數過多，請稍候再試。" );
        }
        const message = Array.isArray(result.errors)
          ? result.errors.map((error) => error.message).filter(Boolean).join(" ")
          : "";
        throw new Error(message || "預約資料送出失敗，請稍後再試。" );
      }

      dialogKicker.textContent = "REQUEST RECEIVED";
      dialogTitle.textContent = "申請已送出";
      dialogIntro.textContent = "您的線上諮詢與現勘安排資料已送達宸胤建築師事務所。";
      summary.hidden = true;
      dialogActions.hidden = true;
      successPanel.hidden = false;
      dialogStatus.textContent = "";
      resetFormAfterSuccess();
      preparedData = null;
    } catch (error) {
      dialogStatus.classList.add("is-error");
      dialogStatus.textContent = error instanceof Error
        ? `${error.message} 您也可以先複製預約內容，或致電本所。`
        : "預約資料送出失敗，請稍後再試。";
      sendBookingButton.disabled = false;
      sendBookingLabel.textContent = "重新送出";
    } finally {
      sending = false;
    }
  }

  function setFormData(data) {
    const applicant = data.applicant.trim();
    const phone = data.phone.trim();
    const address = data.address.trim();
    const lineId = typeof data.lineId === "string" ? data.lineId.trim() : "";
    const parsedDate = new Date(`${data.date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate < minimumBookingDate || toISODate(parsedDate) !== data.date) {
      throw new Error(`預約日期須為 ${toISODate(minimumBookingDate)} 或之後，格式為 YYYY-MM-DD。`);
    }
    const option = [...timeSelect.options].find((item) => item.value === data.time);
    if (!option) throw new Error("預約時段不在可選範圍內。");

    applicantInput.value = applicant;
    phoneInput.value = phone;
    addressInput.value = address;
    lineIdInput.value = lineId;
    selectDate(parsedDate);
    timeSelect.value = option.value;
    timeSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  previousMonthButton.addEventListener("click", () => moveMonth(-1));
  nextMonthButton.addEventListener("click", () => moveMonth(1));

  timeSelect.addEventListener("change", () => {
    projectNote.hidden = timeSelect.value !== "專案另行聯絡預約時間";
    document.querySelector("#time-error").textContent = "";
    timeSelect.removeAttribute("aria-invalid");
  });

  [applicantInput, phoneInput, addressInput, lineIdInput].forEach((input) => {
    input.addEventListener("input", () => {
      if (input.value.trim()) clearError(input, `${input.id}-error`);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = validate();
    if (data) openReview(data);
  });

  closeDialogButton.addEventListener("click", closeReview);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeReview();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dialog.hidden) closeReview();
  });
  copyBooking.addEventListener("click", copyPreparedText);
  sendBookingButton.addEventListener("click", submitBooking);

  function registerWebMCP() {
    const context = document.modelContext;
    if (!context?.registerTool) return;

    try {
      void Promise.resolve(
        context.registerTool({
          name: "prepare_site_visit_request",
          title: "準備線上諮詢與現勘安排",
          description: "填入線上諮詢及現勘安排資料，並在網站開啟送出前的最終確認畫面。此工具不會自動寄出郵件。",
          inputSchema: {
            type: "object",
            properties: {
              applicant: { type: "string", minLength: 1, description: "申請人姓名或公司名稱" },
              phone: { type: "string", minLength: 8, description: "申請人聯絡電話" },
              address: { type: "string", minLength: 1, description: "完整申請地址" },
              lineId: { type: "string", description: "申請人 LINE ID（選填）" },
              date: {
                type: "string",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                description: `預約日期，YYYY-MM-DD；最早 ${toISODate(minimumBookingDate)}（今日起第 7 天）`,
              },
              time: {
                type: "string",
                enum: [
                  "上午 09:00–10:00",
                  "上午 10:00–11:00",
                  "下午 16:00–17:00",
                  "下午 17:00–18:00",
                  "專案另行聯絡預約時間",
                ],
              },
            },
            required: ["applicant", "phone", "address", "date", "time"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (!input || typeof input !== "object") throw new Error("缺少預約資料。");
            const required = ["applicant", "phone", "address", "date", "time"];
            if (required.some((key) => typeof input[key] !== "string" || !input[key].trim())) {
              throw new Error("申請人、聯絡電話、地址、日期與時段皆為必填。");
            }
            setFormData(input);
            const data = validate();
            if (!data) throw new Error("預約資料未通過檢查。");
            openReview(data);
            return { status: "ready_to_send", date: data.dateISO, time: data.time };
          },
        }),
      ).catch(() => {});
    } catch {
      // Browsers without WebMCP continue to use the visible form.
    }
  }

  minimumBookingNote.textContent = `最早可預約：${formatDate(minimumBookingDate)}（須至少提前 ${LEAD_DAYS} 天）`;
  renderCalendar();
  registerWebMCP();
})();
