const postTypeLabels = {
  reply: "リプライ",
  quote: "引用リポスト",
  selfQuote: "自分のポストを引用（相手なし）",
};

const reactionDescriptions = {
  reply: "相手があなたの投稿にリプライしています。",
  quote: "相手があなたの投稿を引用リポストしています。",
  selfQuote: "他者からの反応はなく、あなたが自分のポストを引用リポストしようとしています。",
};

const form = document.getElementById("templateForm");
const formMessage = document.getElementById("formMessage");
const outputPanel = document.getElementById("outputPanel");
const promptOutput = document.getElementById("promptOutput");

outputPanel.hidden = true;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = collectFormData();

  if (!formData.valid) {
    showFormMessage(formData.message, true);
    return;
  }

  const prompt = buildPrompt(formData.values);
  promptOutput.value = prompt;
  outputPanel.hidden = false;
  showFormMessage("テンプレートを更新しました。", false);
});

form.addEventListener("reset", () => {
  promptOutput.value = "";
  outputPanel.hidden = true;
  showFormMessage("入力内容をリセットしました。", false);
});

function collectFormData() {
  const formValues = {
    reactionType: getCheckedValue("reactionType"),
    replyType: getCheckedValue("replyType"),
    selfPost: document.getElementById("selfPost").value.trim(),
    reactionPost: document.getElementById("reactionPost").value.trim(),
    replyDraft: document.getElementById("replyDraft").value.trim(),
    additionalNote: document.getElementById("additionalNote").value.trim(),
  };

  const missingFields = [];

  if (!formValues.reactionType) missingFields.push("相手の反応");
  if (!formValues.replyType) missingFields.push("これから投稿する形式");
  if (!formValues.selfPost) missingFields.push("自分のポスト内容");
  if (!formValues.reactionPost && formValues.reactionType !== "selfQuote") {
    missingFields.push("相手の反応／引用したいポスト");
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `未入力の項目があります: ${missingFields.join("、")}`,
    };
  }

  return { valid: true, values: formValues };
}

function getCheckedValue(name) {
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

function showFormMessage(message, hasError) {
  formMessage.textContent = message;
  formMessage.style.color = hasError ? "var(--danger)" : "var(--success)";
}

function buildPrompt(values) {
  const scenario = reactionDescriptions[values.reactionType] || "X上のやり取りを要約してください。";
  const draftSection = values.replyDraft
    ? values.replyDraft
    : "（具体的な下書きはありません。上記の状況を踏まえて自然な返信案を作成してください。）";
  const reactionSummaryLabel = values.reactionType === "selfQuote" ? "投稿状況" : "相手からの反応";
  const reactionSectionLabel = values.reactionType === "selfQuote" ? "[引用したい自分のポスト]" : "[相手の反応]";

  const promptParts = [
    "# シナリオ",
    `- ${reactionSummaryLabel}: ${postTypeLabels[values.reactionType] || "状況未設定"}`,
    `- これから投稿する形式: ${postTypeLabels[values.replyType]}`,
    `- 状況メモ: ${scenario}`,
    values.additionalNote ? `- 補足要望: ${values.additionalNote}` : "",
    "",
    "# 会話ログ",
    "[自分のポスト]",
    values.selfPost,
  ];

  if (values.reactionPost && values.reactionType === "selfQuote") {
    promptParts.push("", reactionSectionLabel, values.reactionPost);
  } else if (values.reactionType !== "selfQuote") {
    promptParts.push("", reactionSectionLabel, values.reactionPost);
  }

  promptParts.push(
    "",
    "[これから投稿したい文章]",
    draftSection
  );

  return promptParts.filter(Boolean).join("\n");
}

const copyButtons = document.querySelectorAll("button.copy");
copyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;
    const textarea = document.getElementById(targetId);
    if (!textarea || !textarea.value) {
      setCopyFeedback(targetId, "コピーする内容がありません", true);
      return;
    }
    copyToClipboard(textarea.value)
      .then(() => setCopyFeedback(targetId, "コピーしました"))
      .catch(() => setCopyFeedback(targetId, "コピーに失敗しました", true));
  });
});

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "");
    temp.style.position = "absolute";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    temp.select();
    const success = document.execCommand("copy");
    document.body.removeChild(temp);
    success ? resolve() : reject();
  });
}

function setCopyFeedback(targetId, message, isError = false) {
  const feedback = document.querySelector(`.copy-feedback[data-for="${targetId}"]`);
  if (!feedback) return;
  feedback.textContent = message;
  feedback.style.color = isError ? "var(--danger)" : "var(--success)";
  setTimeout(() => {
    feedback.textContent = "";
  }, isError ? 2000 : 3000);
}
