(() => {
  const form = document.querySelector("#booking-form");
  const applicantInput = document.querySelector("#applicant");
  const addressInput = document.querySelector("#address");
  const lineIdInput = document.querySelector("#line-id");
  const dateInput = document.querySelector("#booking-date");
  const monthLabel = document.querySelector("#calendar-month");
  const calendarDays = document.querySelector("#calendar-days");
  const selectedDateLabel = document.querySelector("#selected-date");
  const previousMonthButton = document.querySelector("#previous-month");
  const nextMonthButton = document.querySelector("#next-month");
  const projectNote = document.querySelector("#project-note");
  const dialog = document.querySelector("#review-dialog");
  const closeDialogButton = document.querySelector("#close-dialog");
  const summary = document.querySelector("#booking-summary");
  const emailBooking = document.querySelector("#email-booking");
  const copyBooking = document.querySelector("#copy-booking");
  const copyStatus = document.querySelector("#copy-status");
  const formStatus = document.querySelector("#form-status");

  const today = startOfDay(new Date());
  let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = null;
  let lastFocusedElement = null;
  let preparedText = "";

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
      if (day < today) {
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
      }

      button.addEventListener("click", () => selectDate(day));
      calendarDays.append(button);
    }

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    previousMonthButton.disabled = viewDate <= thisMonth;
  }

  function selectDate(date) {
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
      [lineIdInput, "line-id-error", "請輸入申請人 LINE ID。"],
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

    if (!selectedDate) {
      setError(dateInput, "booking-date-error", "請選擇預約日期。" );
      valid = false;
    } else {
      clearError(dateInput, "booking-date-error");
    }

    const timeInput = form.querySelector('input[name="time"]:checked');
    const timeError = document.querySelector("#time-error");
    if (!timeInput) {
      timeError.textContent = "請選擇一個預約時段。";
      valid = false;
    } else {
      timeError.textContent = "";
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
      lineId: lineIdInput.value.trim(),
      address: addressInput.value.trim(),
      date: formatDate(selectedDate),
      dateISO: dateInput.value,
      time: timeInput.value,
    };
  }

  function bookingText(data) {
    return [
      "宸胤建築師事務所｜現場勘查預約申請",
      "",
      `申請人名稱：${data.applicant}`,
      `申請地址：${data.address}`,
      `預約日期：${data.date}`,
      `預約時段：${data.time}`,
      `申請人 LINE ID：${data.lineId}`,
      "",
      "備註：實際勘查時間以事務所確認通知為準。",
    ].join("\n");
  }

  function openReview(data) {
    const entries = [
      ["申請人名稱", data.applicant],
      ["申請地址", data.address],
      ["預約日期", data.date],
      ["預約時段", data.time],
      ["LINE ID", data.lineId],
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

    preparedText = bookingText(data);
    const subject = `現場勘查預約申請｜${data.applicant}｜${data.dateISO}`;
    emailBooking.href = `mailto:services@chenyin-arch.com.tw?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(preparedText)}`;
    copyStatus.textContent = "";
    lastFocusedElement = document.activeElement;
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    closeDialogButton.focus();
  }

  function closeReview() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    lastFocusedElement?.focus();
  }

  async function copyPreparedText() {
    try {
      await navigator.clipboard.writeText(preparedText);
      copyStatus.textContent = "預約內容已複製。";
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = preparedText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      copyStatus.textContent = "預約內容已複製。";
    }
  }

  function setFormData(data) {
    const applicant = data.applicant.trim();
    const address = data.address.trim();
    const lineId = data.lineId.trim();
    const parsedDate = new Date(`${data.date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate < today || toISODate(parsedDate) !== data.date) {
      throw new Error("預約日期必須是今天或未來日期，格式為 YYYY-MM-DD。");
    }
    const option = [...form.querySelectorAll('input[name="time"]')].find((input) => input.value === data.time);
    if (!option) throw new Error("預約時段不在可選範圍內。");

    applicantInput.value = applicant;
    addressInput.value = address;
    lineIdInput.value = lineId;
    selectDate(parsedDate);
    option.checked = true;
    option.dispatchEvent(new Event("change", { bubbles: true }));
  }

  previousMonthButton.addEventListener("click", () => moveMonth(-1));
  nextMonthButton.addEventListener("click", () => moveMonth(1));

  form.querySelectorAll('input[name="time"]').forEach((input) => {
    input.addEventListener("change", () => {
      projectNote.hidden = input.value !== "專案另行聯絡預約時間";
      document.querySelector("#time-error").textContent = "";
    });
  });

  [applicantInput, addressInput, lineIdInput].forEach((input) => {
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
  emailBooking.addEventListener("click", () => {
    copyStatus.textContent = "郵件已開啟；請在郵件程式中確認寄出。";
  });

  function registerWebMCP() {
    const context = document.modelContext;
    if (!context?.registerTool) return;

    try {
      void Promise.resolve(
        context.registerTool({
          name: "prepare_site_visit_request",
          title: "準備現場勘查預約",
          description: "填入預約資料，並在網站開啟送出前的最終確認畫面。此工具不會自動寄出郵件。",
          inputSchema: {
            type: "object",
            properties: {
              applicant: { type: "string", minLength: 1, description: "申請人姓名或公司名稱" },
              address: { type: "string", minLength: 1, description: "完整申請地址" },
              lineId: { type: "string", minLength: 1, description: "申請人 LINE ID" },
              date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "預約日期，YYYY-MM-DD" },
              time: {
                type: "string",
                enum: ["上午 09:00–11:00", "下午 16:00–18:00", "專案另行聯絡預約時間"],
              },
            },
            required: ["applicant", "address", "lineId", "date", "time"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (!input || typeof input !== "object") throw new Error("缺少預約資料。");
            const required = ["applicant", "address", "lineId", "date", "time"];
            if (required.some((key) => typeof input[key] !== "string" || !input[key].trim())) {
              throw new Error("申請人、地址、LINE ID、日期與時段皆為必填。");
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

  renderCalendar();
  registerWebMCP();
})();
