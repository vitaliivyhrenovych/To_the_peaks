// Ініціалізуємо перевірку після завантаження розмітки.
function initializeFeedbackValidation() {
  const form = document.getElementById("feedbackForm");
  const username = document.getElementById("username");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const message = document.getElementById("message");
  const agreement = document.getElementById("agreement");

  const fields = [username, email, phone, message, agreement];

  if (!form || fields.some((field) => !field)) {
    console.error(
      "Перевірка форми не ініціалізована: не знайдено форму або одне з її полів."
    );
    return;
  }

  // Повертає окремий елемент помилки для кожного поля.
  function getErrorElement(field) {
    const errorId = `${field.id}-error`;
    let errorElement = document.getElementById(errorId);

    if (!errorElement) {
      errorElement = document.createElement("p");
      errorElement.id = errorId;
      errorElement.className = "mt-1 text-sm text-red-600";
      errorElement.hidden = true;

      if (field.type === "checkbox") {
        field.parentElement.insertAdjacentElement("afterend", errorElement);
      } else {
        field.insertAdjacentElement("afterend", errorElement);
      }
    }

    const describedBy = new Set(
      (field.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter(Boolean)
    );
    describedBy.add(errorId);
    field.setAttribute("aria-describedby", [...describedBy].join(" "));

    return errorElement;
  }

  const errorElements = new Map(
    fields.map((field) => [field, getErrorElement(field)])
  );

  // Нативний діалог забезпечує модальність, клавіатурний trap та Escape.
  const successDialog = document.createElement("dialog");
  successDialog.id = "feedback-success-dialog";
  successDialog.className =
    "fixed inset-0 m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md rounded-lg border-0 bg-[#F7F5EF] p-6 text-[#202A24] shadow-[0_0.5rem_1.5rem_rgb(32_42_36_/_20%)] backdrop:bg-black/60";
  successDialog.setAttribute("aria-labelledby", "feedback-success-title");
  successDialog.setAttribute("aria-describedby", "feedback-success-message");

  const dialogTitle = document.createElement("h2");
  dialogTitle.id = "feedback-success-title";
  dialogTitle.className = "text-xl font-semibold";
  dialogTitle.textContent = "Перевірку пройдено";

  const dialogMessage = document.createElement("p");
  dialogMessage.id = "feedback-success-message";
  dialogMessage.className = "mt-3 text-[#606A63]";
  dialogMessage.textContent =
    "Натисніть «Перейти до пошти», щоб відкрити поштовий клієнт і завершити надсилання заявки.";

  const continueButton = document.createElement("button");
  continueButton.type = "button";
  continueButton.className =
    "mt-6 inline-flex min-h-12 w-full items-center justify-center rounded bg-[#43634E] px-5 font-semibold text-white hover:bg-[#304A39] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#43634E]";
  continueButton.textContent = "Перейти до пошти";
  continueButton.addEventListener("click", () => {
    successDialog.close();
    HTMLFormElement.prototype.submit.call(form);
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className =
    "mt-3 inline-flex min-h-12 w-full items-center justify-center rounded border border-[#43634E] px-5 font-semibold text-[#43634E] hover:bg-[#EEEAE0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#43634E]";
  closeButton.textContent = "Закрити";
  closeButton.addEventListener("click", () => successDialog.close());

  successDialog.append(dialogTitle, dialogMessage, continueButton, closeButton);
  document.body.append(successDialog);

  let previouslyFocusedElement = null;
  successDialog.addEventListener("close", () => {
    if (previouslyFocusedElement instanceof HTMLElement) {
      previouslyFocusedElement.focus();
    }
  });

  function showSuccessDialog() {
    previouslyFocusedElement = document.activeElement;
    successDialog.showModal();
    closeButton.focus();
  }

  // Окремі перевірки полів спрощують підтримку правил валідації.
  function validateUsername() {
    const length = username.value.trim().length;
    return length >= 2 && length <= 80
      ? ""
      : "Введіть ім’я — від 2 до 80 символів.";
  }

  function validateEmail() {
    return email.validity.valid
      ? ""
      : "Введіть коректну адресу електронної пошти.";
  }

  function validatePhone() {
    return /^\+380\d{9}$/.test(phone.value)
      ? ""
      : "Введіть номер у форматі +380XXXXXXXXX.";
  }

  function validateMessage() {
    const length = message.value.trim().length;
    return length >= 10 && length <= 2000
      ? ""
      : "Повідомлення має містити від 10 до 2000 символів.";
  }

  function validateAgreement() {
    return agreement.checked
      ? ""
      : "Потрібно погодитися з політикою конфіденційності.";
  }

  const validators = new Map([
    [username, validateUsername],
    [email, validateEmail],
    [phone, validatePhone],
    [message, validateMessage],
    [agreement, validateAgreement],
  ]);

  // Показує помилку або позначає поле як валідне.
  function updateFieldState(field) {
    const errorMessage = validators.get(field)();
    const errorElement = errorElements.get(field);
    const isInvalid = Boolean(errorMessage);

    field.classList.toggle("border-red-500", isInvalid);
    field.classList.toggle("border-green-500", !isInvalid);
    field.setAttribute("aria-invalid", String(isInvalid));

    errorElement.textContent = errorMessage;
    errorElement.hidden = !isInvalid;

    return !isInvalid;
  }

  fields.forEach((field) => {
    field.addEventListener("blur", () => {
      updateFieldState(field);
    });

    const eventName = field.type === "checkbox" ? "change" : "input";
    field.addEventListener(eventName, () => {
      // Починаємо перевірку лише після першої зміни значення.
      updateFieldState(field);
    });
  });

  // Не надсилаємо форму, якщо хоча б одне поле не пройшло перевірку.
  form.noValidate = true;
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const invalidFields = fields.filter((field) => {
      return !updateFieldState(field);
    });

    if (invalidFields.length > 0) {
      invalidFields[0].focus();
      return;
    }

    showSuccessDialog();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFeedbackValidation);
} else {
  initializeFeedbackValidation();
}