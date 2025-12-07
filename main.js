const API_BASE_URL = "http://localhost:8000";
const USER_KEY = "amumal-user";

// ---------- 공통 유틸 ----------

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidPassword(pwd) {
  // 8~20, 대문자/소문자/숫자/특수문자 최소 1개씩
  const re =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;
  return re.test(pwd);
}

function isValidNickname(nickname) {
  if (!nickname) return false;
  if (nickname.length > 10) return false;
  if (/\s/.test(nickname)) return false;
  return true;
}

function setButtonActive(button, active) {
  if (!button) return;
  if (active) {
    button.classList.add("active");
    button.disabled = false;
  } else {
    button.classList.remove("active");
    button.disabled = true;
  }
}

function setHelper(el, message, type) {
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("helper-error", "helper-success");
  if (type === "error") el.classList.add("helper-error");
  if (type === "success") el.classList.add("helper-success");
}

// 숫자 -> 1k / 10k / 100k
function formatCount(value) {
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) value = parsed;
    else return value;
  }
  if (typeof value !== "number") return String(value);

  if (value >= 100000) return "100k";
  if (value >= 10000) return "10k";
  if (value >= 1000) {
    return Math.round(value / 1000) + "k";
  }
  return String(value);
}

// 제목 26자 제한
function truncateTitle(title) {
  if (!title) return "";
  return title.slice(0, 26);
}

// 세션 저장/조회
function saveUserSession(apiData, email) {
  const user = {
    user_id: apiData.user_id,
    nickname: apiData.profile_nickname,
    profile_image: apiData.profile_img_url,
    email,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getUserSession() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearUserSession() {
  localStorage.removeItem(USER_KEY);
}

// 인증이 필요한 페이지 공통 초기화
function initAuthedPage() {
  const user = getUserSession();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  initHeaderWithProfile(user);
  return user;
}

// 쿼리 파라미터 읽기 (?postId=1)
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// ---------- 헤더 프로필/로그아웃 ----------

function initHeaderWithProfile(user) {
  const profileBtn = document.getElementById(
    "header-profile-btn"
  );
  const profileMenu = document.getElementById(
    "header-profile-menu"
  );
  if (!profileBtn || !profileMenu) return;

  // 이미지 or 이니셜
  if (user.profile_image) {
    const img = document.createElement("img");
    img.src = user.profile_image;
    profileBtn.innerHTML = "";
    profileBtn.appendChild(img);
  } else {
    profileBtn.innerHTML = "";
    const span = document.createElement("span");
    span.className = "header-profile-initial";
    span.textContent = user.nickname
      ? user.nickname[0].toUpperCase()
      : "U";
    profileBtn.appendChild(span);
  }

  const toggleMenu = () => {
    profileMenu.classList.toggle("hidden");
  };

  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", () => {
    profileMenu.classList.add("hidden");
  });

  profileMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    const action = e.target.dataset.action;
    if (!action) return;

    if (action === "edit-profile") {
      window.location.href = "profile_edit.html";
    } else if (action === "edit-password") {
      window.location.href = "password_edit.html";
    } else if (action === "logout") {
      handleLogout(user);
    }
  });
}

async function handleLogout(user) {
  if (!user) return;
  try {
    await fetch(
      `${API_BASE_URL}/user/logout/${user.user_id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
  } catch (e) {
    console.error(e);
  } finally {
    clearUserSession();
    window.location.href = "login.html";
  }
}

// ---------- 로그인 페이지 ----------

function initLoginPage() {
  const emailInput = document.getElementById("login-email");
  const pwdInput = document.getElementById("login-password");
  const emailHelper = document.getElementById(
    "login-email-helper"
  );
  const pwdHelper = document.getElementById(
    "login-password-helper"
  );
  const formHelper = document.getElementById(
    "login-form-helper"
  );
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("go-signup-btn");

  let emailValid = false;
  let pwdValid = false;

  function updateLoginButton() {
    setButtonActive(loginBtn, emailValid && pwdValid);
  }

  emailInput.addEventListener("blur", () => {
    const value = emailInput.value.trim();
    if (!value || !isValidEmail(value)) {
      emailValid = false;
      setHelper(
        emailHelper,
        "올바른 이메일 주소 형식을 입력해주세요.",
        "error"
      );
    } else {
      emailValid = true;
      setHelper(emailHelper, "");
    }
    updateLoginButton();
  });

  pwdInput.addEventListener("blur", () => {
    const value = pwdInput.value;
    if (!value) {
      pwdValid = false;
      setHelper(
        pwdHelper,
        "비밀번호를 입력해주세요",
        "error"
      );
    } else if (!isValidPassword(value)) {
      pwdValid = false;
      setHelper(
        pwdHelper,
        "8자 이상 20자 이하이고 대문자, 소문자, 숫자, 특수문자를 최소 1개씩 포함하세요",
        "error"
      );
    } else {
      pwdValid = true;
      setHelper(pwdHelper, "");
    }
    updateLoginButton();
  });

  [emailInput, pwdInput].forEach((el) =>
    el.addEventListener("input", () => {
      updateLoginButton();
      setHelper(formHelper, "");
    })
  );

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!(emailValid && pwdValid)) return;

    const payload = {
      email: emailInput.value.trim(),
      password: pwdInput.value,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 200) {
        const data = await res.json();
        if (data.detail === "login_success") {
          saveUserSession(data.data, payload.email);
          window.location.href = "posts.html";
          return;
        }
      }

      setHelper(
        formHelper,
        "아이디 또는 비밀번호를 확인해주세요",
        "error"
      );
    } catch (err) {
      console.error(err);
      setHelper(
        formHelper,
        "아이디 또는 비밀번호를 확인해주세요",
        "error"
      );
    }
  });

  signupBtn.addEventListener("click", () => {
    window.location.href = "signup.html";
  });
}

// ---------- 회원가입 페이지 ----------

function initSignupPage() {
  const backBtn = document.getElementById("signup-back-btn");
  const toLoginBtn = document.getElementById(
    "signup-go-login-btn"
  );

  const emailInput = document.getElementById("signup-email");
  const emailHelper = document.getElementById(
    "signup-email-helper"
  );

  const pwdInput = document.getElementById("signup-password");
  const pwdHelper = document.getElementById(
    "signup-password-helper"
  );

  const pwdConfirmInput = document.getElementById(
    "signup-password-confirm"
  );
  const pwdConfirmHelper = document.getElementById(
    "signup-password-confirm-helper"
  );

  const nicknameInput = document.getElementById(
    "signup-nickname"
  );
  const nicknameHelper = document.getElementById(
    "signup-nickname-helper"
  );

  const signupBtn = document.getElementById("signup-btn");

  const profileCircle = document.getElementById(
    "profile-circle"
  );
  const profileInput = document.getElementById(
    "profile-file-input"
  );
  const profileHelper = document.getElementById(
    "profile-helper"
  );

  let profileImagePath = null;
  let emailValid = false;
  let emailAvailable = false;
  let pwdValid = false;
  let pwdConfirmValid = false;
  let nicknameValid = false;
  let nicknameAvailable = false;

  function updateSignupButton() {
    const canSubmit =
      emailValid &&
      emailAvailable &&
      pwdValid &&
      pwdConfirmValid &&
      nicknameValid &&
      nicknameAvailable;
    setButtonActive(signupBtn, canSubmit);
  }

  const goLogin = () => (window.location.href = "login.html");
  backBtn.addEventListener("click", goLogin);
  toLoginBtn.addEventListener("click", goLogin);

  // 이메일
  emailInput.addEventListener("blur", async () => {
    const value = emailInput.value.trim();
    emailAvailable = false;

    if (!value || !isValidEmail(value)) {
      emailValid = false;
      setHelper(
        emailHelper,
        "올바른 이메일 주소 형식을 입력해주세요.",
        "error"
      );
      updateSignupButton();
      return;
    }

    emailValid = true;

    try {
      const res = await fetch(
        `${API_BASE_URL}/user/check-email?email=${encodeURIComponent(
          value
        )}`,
        { method: "GET", credentials: "include" }
      );

      if (res.status === 200) {
        const data = await res.json();
        if (data.data && data.data.possible) {
          emailAvailable = true;
          setHelper(
            emailHelper,
            "사용가능한 이메일입니다.",
            "success"
          );
        } else {
          emailAvailable = false;
          setHelper(
            emailHelper,
            "중복된 이메일 입니다.",
            "error"
          );
        }
      } else if (res.status === 400) {
        emailValid = false;
        setHelper(
          emailHelper,
          "올바른 이메일 주소 형식을 입력해주세요.",
          "error"
        );
      } else {
        emailAvailable = false;
        setHelper(
          emailHelper,
          "이메일 확인 중 오류가 발생했습니다.",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      emailAvailable = false;
      setHelper(
        emailHelper,
        "이메일 확인 중 오류가 발생했습니다.",
        "error"
      );
    }

    updateSignupButton();
  });

  // 비밀번호
  pwdInput.addEventListener("blur", () => {
    const value = pwdInput.value;

    if (!value) {
      pwdValid = false;
      setHelper(
        pwdHelper,
        "비밀번호를 입력해주세요",
        "error"
      );
    } else if (!isValidPassword(value)) {
      pwdValid = false;
      setHelper(
        pwdHelper,
        "8자 이상 20자 이하이고 대문자, 소문자, 숫자, 특수문자를 최소 1개씩 포함하세요",
        "error"
      );
    } else {
      pwdValid = true;
      setHelper(pwdHelper, "");
    }

    validatePasswordConfirm();
    updateSignupButton();
  });

  function validatePasswordConfirm() {
    const v = pwdConfirmInput.value;

    if (!v) {
      pwdConfirmValid = false;
      setHelper(
        pwdConfirmHelper,
        "비밀번호를 입력해주세요",
        "error"
      );
      return;
    }
    if (v !== pwdInput.value) {
      pwdConfirmValid = false;
      setHelper(
        pwdConfirmHelper,
        "비밀번호가 다릅니다",
        "error"
      );
    } else {
      pwdConfirmValid = true;
      setHelper(pwdConfirmHelper, "");
    }
  }

  pwdConfirmInput.addEventListener("blur", () => {
    validatePasswordConfirm();
    updateSignupButton();
  });

  // 닉네임
  nicknameInput.addEventListener("blur", async () => {
    const value = nicknameInput.value.trim();
    nicknameAvailable = false;

    if (!value) {
      nicknameValid = false;
      setHelper(
        nicknameHelper,
        "닉네임을 입력해주세요",
        "error"
      );
      updateSignupButton();
      return;
    }

    if (!isValidNickname(value)) {
      nicknameValid = false;
      setHelper(
        nicknameHelper,
        "10자 이내, 띄어쓰기 불가",
        "error"
      );
      updateSignupButton();
      return;
    }

    nicknameValid = true;

    try {
      const res = await fetch(
        `${API_BASE_URL}/user/check-nickname?nickname=${encodeURIComponent(
          value
        )}`,
        { method: "GET", credentials: "include" }
      );

      if (res.status === 200) {
        const data = await res.json();
        if (data.data && data.data.possible) {
          nicknameAvailable = true;
          setHelper(
            nicknameHelper,
            "사용가능한 닉네임입니다.",
            "success"
          );
        } else {
          nicknameAvailable = false;
          setHelper(
            nicknameHelper,
            "중복된 닉네임입니다.",
            "error"
          );
        }
      } else if (res.status === 400) {
        nicknameValid = false;
        setHelper(
          nicknameHelper,
          "10자 이내, 띄어쓰기 불가",
          "error"
        );
      } else {
        nicknameAvailable = false;
        setHelper(
          nicknameHelper,
          "닉네임 확인 중 오류가 발생했습니다.",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      nicknameAvailable = false;
      setHelper(
        nicknameHelper,
        "닉네임 확인 중 오류가 발생했습니다.",
        "error"
      );
    }

    updateSignupButton();
  });

  // 프로필 이미지
  profileCircle.addEventListener("click", () => {
    const hasImage =
      profileCircle.querySelector("img") !== null;
    if (hasImage) {
      profileCircle.innerHTML = "<span>+</span>";
      profileImagePath = null;
      setHelper(
        profileHelper,
        "프로필 사진을 추가하세요.",
        "error"
      );
      updateSignupButton();
      return;
    }
    profileInput.click();
  });

  profileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) {
      if (!profileImagePath) {
        setHelper(
          profileHelper,
          "프로필 사진을 추가하세요.",
          "error"
        );
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      profileCircle.innerHTML = "";
      const img = document.createElement("img");
      img.src = reader.result;
      profileCircle.appendChild(img);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.status === 201) {
        const data = await res.json();
        if (data.data && data.data.file_path) {
          profileImagePath = data.data.file_path;
          setHelper(profileHelper, "", "");
        } else {
          profileImagePath = null;
          setHelper(
            profileHelper,
            "이미지 업로드 중 오류가 발생했습니다.",
            "error"
          );
        }
      } else {
        profileImagePath = null;
        setHelper(
          profileHelper,
          "이미지 업로드 중 오류가 발생했습니다.",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      profileImagePath = null;
      setHelper(
        profileHelper,
        "이미지 업로드 중 오류가 발생했습니다.",
        "error"
      );
    }

    updateSignupButton();
  });

  // 회원가입 요청
  signupBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const canSubmit =
      emailValid &&
      emailAvailable &&
      pwdValid &&
      pwdConfirmValid &&
      nicknameValid &&
      nicknameAvailable;

    if (!canSubmit) return;

    const payload = {
      email: emailInput.value.trim(),
      password: pwdInput.value,
      nickname: nicknameInput.value.trim(),
    };

    if (profileImagePath) {
      payload.profile_image = profileImagePath;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/user/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        const data = await res.json();
        if (data.detail === "register_success") {
          alert("회원가입이 완료되었습니다.");
          window.location.href = "login.html";
          return;
        }
      }

      alert(
        "회원가입에 실패했습니다. 입력 내용을 다시 확인해주세요."
      );
    } catch (err) {
      console.error(err);
      alert("회원가입 중 오류가 발생했습니다.");
    }
  });
}

// ---------- 게시글 목록 페이지 ----------

function initPostsPage() {
  const user = initAuthedPage();
  if (!user) return;

  const listEl = document.getElementById("posts-list");
  const loadingEl = document.getElementById(
    "posts-loading"
  );
  const writeBtn = document.getElementById("btn-write");

  let cursorId = 0;
  const PAGE_SIZE = 10;
  let isLoading = false;
  let hasMore = true;

  writeBtn.addEventListener("click", () => {
    window.location.href = "post_create.html"; // 나중에 만들 페이지
  });

  async function fetchPosts() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    loadingEl.textContent = "불러오는 중...";

    try {
      const res = await fetch(
        `${API_BASE_URL}/posts?cursor_id=${cursorId}&count=${PAGE_SIZE}`,
        { method: "GET", credentials: "include" }
      );

      if (res.status !== 200) {
        loadingEl.textContent = "";
        hasMore = false;
        return;
      }

      const data = await res.json();
      if (
        !data.data ||
        !Array.isArray(data.data.post_list)
      ) {
        hasMore = false;
        loadingEl.textContent = "";
        return;
      }

      const posts = data.data.post_list;
      posts.forEach((post) => {
        const card = document.createElement("article");
        card.className = "post-card";
        card.dataset.postId = post.post_id;

        const title = truncateTitle(post.title || "");
        const views = formatCount(post.views);
        const likes = formatCount(post.likes);
        const comments = formatCount(post.comments_count);

        card.innerHTML = `
          <div class="post-title">${title}</div>
          <div class="post-meta-row">
            <div>좋아요 ${likes} · 댓글 ${comments} · 조회수 ${views}</div>
            <div>${post.created_at}</div>
          </div>
          <div class="post-summary">${post.summary || ""}</div>
          <div class="post-author-row">
            <div class="post-author-avatar"></div>
            <div>${post.author_nickname}</div>
          </div>
        `;

        const avatarDiv = card.querySelector(".post-author-avatar");
        if (avatarDiv) {
          const imgUrl = post.author_profile_image;
          const nickname = post.author_nickname || "U";

          if (imgUrl && typeof imgUrl === "string") {
            // 이미지가 있는 경우: 배경 이미지로 표시
            avatarDiv.style.backgroundImage = `url(${imgUrl})`;
            avatarDiv.style.backgroundSize = "cover";
            avatarDiv.style.backgroundPosition = "center";
            avatarDiv.style.backgroundRepeat = "no-repeat";
            avatarDiv.textContent = ""; // 글자 제거
          } else {
            // 이미지가 없는 경우: 이니셜 표시
            avatarDiv.style.backgroundImage = "none";
            avatarDiv.textContent = nickname.charAt(0).toUpperCase();
          }
        }

        card.addEventListener("click", () => {
          window.location.href = `post_detail.html?postId=${post.post_id}`;
        });

        listEl.appendChild(card);
      });

      if (data.data.next_cursor != null) {
        cursorId = data.data.next_cursor;
        hasMore = true;
        loadingEl.textContent = "아래로 스크롤하면 더 불러옵니다.";
      } else {
        hasMore = false;
        loadingEl.textContent = "더 이상 게시글이 없습니다.";
      }
    } catch (err) {
      console.error(err);
      loadingEl.textContent = "게시글을 불러오지 못했습니다.";
      hasMore = false;
    } finally {
      isLoading = false;
    }
  }

  // 최초 로드
  fetchPosts();

  // 인피니티 스크롤
  window.addEventListener("scroll", () => {
    if (!hasMore || isLoading) return;
    const scrollBottom =
      window.innerHeight + window.scrollY;
    if (scrollBottom >= document.body.offsetHeight - 200) {
      fetchPosts();
    }
  });
}

// ---------- 회원정보 수정 페이지 ----------

function initProfileEditPage() {
  const user = initAuthedPage();
  if (!user) return;

  const emailInput = document.getElementById(
    "profile-email"
  );
  const nicknameInput = document.getElementById(
    "profile-nickname"
  );
  const nicknameHelper = document.getElementById(
    "profile-nickname-helper"
  );
  const updateBtn = document.getElementById(
    "profile-update-btn"
  );

  const profileCircle = document.getElementById(
    "profile-circle"
  );
  const profileInput = document.getElementById(
    "profile-file-input"
  );
  const profileHelper = document.getElementById(
    "profile-helper"
  );

  const toast = document.getElementById("toast");
  const toastBtn = document.getElementById(
    "toast-confirm-btn"
  );

  const modalBackdrop = document.getElementById(
    "delete-modal-backdrop"
  );
  const modalCancel = document.getElementById(
    "modal-btn-cancel"
  );
  const modalConfirm = document.getElementById(
    "modal-btn-confirm"
  );
  const deleteBtn = document.getElementById(
    "btn-delete-user"
  );

  let nicknameValid = true;
  let nicknameAvailable = true;
  let profileImagePath = user.profile_image || null;

  // 초기 값 세팅
  emailInput.value = user.email || "";
  nicknameInput.value = user.nickname || "";

  if (user.profile_image) {
    profileCircle.innerHTML = "";
    const img = document.createElement("img");
    img.src = user.profile_image;
    profileCircle.appendChild(img);
    setHelper(profileHelper, "", "");
  } else {
    profileCircle.innerHTML = "<span>+</span>";
    setHelper(
      profileHelper,
      "프로필 사진을 추가하세요.",
      "error"
    );
  }

  function updateUserButton() {
    const can =
      nicknameValid && nicknameAvailable && nicknameInput.value.trim();
    setButtonActive(updateBtn, !!can);
  }

  // 닉네임 blur 시 유효성 + 중복
  nicknameInput.addEventListener("blur", async () => {
    const value = nicknameInput.value.trim();
    nicknameAvailable = false;

    if (!value) {
      nicknameValid = false;
      setHelper(
        nicknameHelper,
        "닉네임을 입력해주세요",
        "error"
      );
      updateUserButton();
      return;
    }

    if (!isValidNickname(value)) {
      nicknameValid = false;
      setHelper(
        nicknameHelper,
        "10자 이내, 띄어쓰기 불가",
        "error"
      );
      updateUserButton();
      return;
    }

    nicknameValid = true;

    // 기존 닉네임이면 굳이 중복확인 안 함
    if (value === user.nickname) {
      nicknameAvailable = true;
      setHelper(nicknameHelper, "", "");
      updateUserButton();
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/user/check-nickname?nickname=${encodeURIComponent(
          value
        )}`,
        { method: "GET", credentials: "include" }
      );

      if (res.status === 200) {
        const data = await res.json();
        if (data.data && data.data.possible) {
          nicknameAvailable = true;
          setHelper(
            nicknameHelper,
            "사용가능한 닉네임입니다.",
            "success"
          );
        } else {
          nicknameAvailable = false;
          setHelper(
            nicknameHelper,
            "중복된 닉네임입니다.",
            "error"
          );
        }
      } else if (res.status === 400) {
        nicknameValid = false;
        setHelper(
          nicknameHelper,
          "10자 이내, 띄어쓰기 불가",
          "error"
        );
      } else {
        nicknameAvailable = false;
        setHelper(
          nicknameHelper,
          "닉네임 확인 중 오류가 발생했습니다.",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      nicknameAvailable = false;
      setHelper(
        nicknameHelper,
        "닉네임 확인 중 오류가 발생했습니다.",
        "error"
      );
    }

    updateUserButton();
  });

  // 프로필 이미지 클릭/업로드
  profileCircle.addEventListener("click", () => {
    const hasImage =
      profileCircle.querySelector("img") !== null;
    if (hasImage) {
      profileCircle.innerHTML = "<span>+</span>";
      profileImagePath = null;
      setHelper(
        profileHelper,
        "프로필 사진을 추가하세요.",
        "error"
      );
      updateUserButton();
      return;
    }
    profileInput.click();
  });

  profileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) {
      if (!profileImagePath) {
        setHelper(
          profileHelper,
          "프로필 사진을 추가하세요.",
          "error"
        );
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      profileCircle.innerHTML = "";
      const img = document.createElement("img");
      img.src = reader.result;
      profileCircle.appendChild(img);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.status === 201) {
        const data = await res.json();
        if (data.data && data.data.file_path) {
          profileImagePath = data.data.file_path;
          setHelper(profileHelper, "", "");
        } else {
          profileImagePath = null;
          setHelper(
            profileHelper,
            "이미지 업로드 중 오류가 발생했습니다.",
            "error"
          );
        }
      } else {
        profileImagePath = null;
        setHelper(
          profileHelper,
          "이미지 업로드 중 오류가 발생했습니다.",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      profileImagePath = null;
      setHelper(
        profileHelper,
        "이미지 업로드 중 오류가 발생했습니다.",
        "error"
      );
    }

    updateUserButton();
  });

  // 수정 완료 토스트에서 확인 누르면 목록으로
  toastBtn.addEventListener("click", () => {
    toast.classList.add("hidden");
    window.location.href = "posts.html";
  });

  // 회원정보 수정 요청
  updateBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!nicknameValid || !nicknameAvailable) return;

    const payload = {
      nickname: nicknameInput.value.trim(),
      profile_image: profileImagePath,
    };

    try {
      const res = await fetch(
        `${API_BASE_URL}/user/update-me/${user.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 200) {
        const data = await res.json();
        if (data.detail === "profile_update_success") {
          // 로컬 세션도 업데이트
          const updated = {
            ...user,
            nickname: data.data.nickname,
            profile_image: data.data.profile_image,
          };
          localStorage.setItem(
            USER_KEY,
            JSON.stringify(updated)
          );
          toast.classList.remove("hidden");
          return;
        }
      }

      alert("회원정보 수정에 실패했습니다.");
    } catch (err) {
      console.error(err);
      alert("회원정보 수정 중 오류가 발생했습니다.");
    }
  });

  // 회원 탈퇴 모달
  deleteBtn.addEventListener("click", () => {
    modalBackdrop.classList.remove("hidden");
  });

  modalCancel.addEventListener("click", () => {
    modalBackdrop.classList.add("hidden");
  });

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.classList.add("hidden");
    }
  });

  modalConfirm.addEventListener("click", async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/user/${user.user_id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (res.status === 200) {
        clearUserSession();
        window.location.href = "login.html";
        return;
      }

      alert("회원 탈퇴에 실패했습니다.");
    } catch (err) {
      console.error(err);
      alert("회원 탈퇴 중 오류가 발생했습니다.");
    }
  });

  updateUserButton();
}

// ---------- 비밀번호 수정 페이지 ----------

function initPasswordEditPage() {
  const user = initAuthedPage();
  if (!user) return;

  const currentInput = document.getElementById(
    "pwd-current"
  );
  const newInput = document.getElementById("pwd-new");
  const confirmInput = document.getElementById(
    "pwd-confirm"
  );

  const currentHelper = document.getElementById(
    "pwd-current-helper"
  );
  const newHelper = document.getElementById(
    "pwd-new-helper"
  );
  const confirmHelper = document.getElementById(
    "pwd-confirm-helper"
  );

  const updateBtn = document.getElementById(
    "pwd-update-btn"
  );

  let currentValid = false;
  let newValid = false;
  let confirmValid = false;

  function updatePasswordState() {
    const can =
      currentValid && newValid && confirmValid;
    setButtonActive(updateBtn, can);
  }

  currentInput.addEventListener("blur", () => {
    if (!currentInput.value) {
      currentValid = false;
      setHelper(
        currentHelper,
        "비밀번호를 입력해주세요",
        "error"
      );
    } else {
      currentValid = true;
      setHelper(currentHelper, "");
    }
    updatePasswordState();
  });

  newInput.addEventListener("blur", () => {
    const v = newInput.value;
    if (!v) {
      newValid = false;
      setHelper(
        newHelper,
        "비밀번호를 입력해주세요",
        "error"
      );
    } else if (!isValidPassword(v)) {
      newValid = false;
      setHelper(
        newHelper,
        "8자 이상 20자 이하이고 대문자, 소문자, 숫자, 특수문자를 최소 1개씩 포함하세요",
        "error"
      );
    } else {
      newValid = true;
      setHelper(newHelper, "");
    }
    validateConfirm();
    updatePasswordState();
  });

  function validateConfirm() {
    const v = confirmInput.value;
    if (!v) {
      confirmValid = false;
      setHelper(
        confirmHelper,
        "비밀번호를 입력해주세요",
        "error"
      );
      return;
    }
    if (v !== newInput.value) {
      confirmValid = false;
      setHelper(
        confirmHelper,
        "비밀번호가 다릅니다",
        "error"
      );
    } else {
      confirmValid = true;
      setHelper(confirmHelper, "");
    }
  }

  confirmInput.addEventListener("blur", () => {
    validateConfirm();
    updatePasswordState();
  });

  updateBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!(currentValid && newValid && confirmValid))
      return;

    const payload = {
      current_password: currentInput.value,
      new_password: newInput.value,
    };

    try {
      const res = await fetch(
        `${API_BASE_URL}/user/update-password/${user.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 200) {
        const data = await res.json();
        if (data.detail === "password_update_success") {
          alert("비밀번호가 변경되었습니다.");
          window.location.href = "posts.html";
          return;
        }
      } else if (res.status === 400) {
        const data = await res.json();
        if (data.detail === "invalid_password") {
          setHelper(
            currentHelper,
            "현재 비밀번호가 올바르지 않습니다.",
            "error"
          );
          currentValid = false;
          updatePasswordState();
          return;
        }
      }

      alert("비밀번호 변경에 실패했습니다.");
    } catch (err) {
      console.error(err);
      alert("비밀번호 변경 중 오류가 발생했습니다.");
    }
  });

  updatePasswordState();
}


// ---------------- 게시글 작성 페이지 ----------------

function initCreatePostPage() {
  const user = initAuthedPage();
  if (!user) return;

  const backBtn = document.getElementById("post-back-btn");
  const titleInput = document.getElementById("post-title");
  const contentInput = document.getElementById("post-content");
  const mainHelper = document.getElementById("post-main-helper");
  const imageInput = document.getElementById("post-image-input");
  const imageHelper = document.getElementById("post-image-helper");
  const submitBtn = document.getElementById("post-submit-btn");

  let postImageUrl = null;
  let titleFilled = false;
  let contentFilled = false;

  // 뒤로가기 -> 게시글 목록
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "posts.html";
    });
  }

  function updateMainHelper() {
    if (!titleFilled || !contentFilled) {
      mainHelper.textContent = "제목, 내용을 모두 작성해주세요.";
      mainHelper.classList.remove("success");
    } else {
      mainHelper.textContent = "";
    }
  }

  function updateSubmitButton() {
    const canSubmit =titleFilled && contentFilled;
    setButtonActive(submitBtn, canSubmit);
  }

  // 제목
  titleInput.addEventListener("input", () => {
    if (titleInput.value.length > 26) {
      titleInput.value = titleInput.value.slice(0, 26);
    }
    titleFilled = titleInput.value.trim().length > 0;
    updateMainHelper();
    updateSubmitButton();
  });

  // 내용
  contentInput.addEventListener("input", () => {
    contentFilled = contentInput.value.trim().length > 0;
    updateMainHelper();
    updateSubmitButton();
  });

  // 이미지 업로드
  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) {
      postImageUrl = null;
      imageHelper.textContent = "파일을 선택해주세요.";
      imageHelper.classList.remove("success");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    imageHelper.textContent = "이미지를 업로드 중입니다...";
    imageHelper.classList.remove("success");

    try {
      const res = await fetch(`${API_BASE_URL}/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.status === 201) {
        const data = await res.json();
        if (data.data && data.data.file_path) {
          postImageUrl = data.data.file_path;
          setHelper(imageHelper, "", "");
        } else {
          postImageUrl = null;
          setHelper(
            imageHelper,
            "이미지 업로드 중 오류가 발생했습니다.",
            "error"
          );
        }
      } else {
        postImageUrl = null;
        setHelper(
          imageHelper,
          "이미지 업로드 중 오류가 발생했습니다.",
          "error"
        );
      }
    } catch (err) {
      postImageUrl = null;
      setHelper(
        imageHelper,
        "이미지 업로드 중 오류가 발생했습니다.",
        "error"
      );
    }
  });

  // 게시글 등록
  submitBtn.addEventListener("click", async () => {
    if (!titleFilled || !contentFilled) {
      updateMainHelper();
      return;
    }

    const payload = {
      user_id: user.user_id,
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      image_url: postImageUrl,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201 && data.detail === "post_create_success") {
        window.location.href = "posts.html";
      } else {
        console.error("post create error:", res.status, data);
        alert("게시글 등록에 실패했습니다. (" + (data.detail || res.status) + ")");
      }
    } catch (err) {
      console.error(err);
      alert("게시글 등록 중 오류가 발생했습니다.");
    }
  });

  // 초기 상태 세팅
  titleFilled = false;
  contentFilled = false;
  updateMainHelper();
  updateSubmitButton();
}

// ---------- 게시글 수정 페이지 ----------
async function initPostEditPage() {
  const user = initAuthedPage();
  if (!user) return;

  const postId = getQueryParam("postId");
  if (!postId) {
    alert("잘못된 접근입니다.");
    window.location.href = "posts.html";
    return;
  }

  const backBtn = document.getElementById("edit-back-btn");
  const titleInput = document.getElementById("edit-title");
  const contentInput = document.getElementById("edit-content");
  const mainHelper = document.getElementById("edit-main-helper");
  const imageInput = document.getElementById("edit-image-input");
  const imageHelper = document.getElementById("edit-image-helper");
  const fileRow = document.getElementById("edit-image-file-row");
  const currentImageRow = document.getElementById("current-image-row");
  const currentImageLabel = document.getElementById("current-image-label");
  const deleteImageBtn = document.getElementById("delete-image-btn");

  const submitBtn = document.getElementById("edit-submit-btn");

  backBtn.addEventListener("click", () => {
    window.location.href = `post_detail.html?postId=${postId}`;
  });

  let imageUrl = null;
  let titleFilled = false;
  let contentFilled = false;

  function updateMainHelper() {
    if (!titleFilled || !contentFilled) {
      mainHelper.textContent = "제목, 내용을 모두 작성해주세요.";
      mainHelper.classList.remove("success");
    } else {
      mainHelper.textContent = "";
    }
  }

  function updateSubmitButton() {
    const canSubmit =titleFilled && contentFilled;
    setButtonActive(submitBtn, canSubmit);
  }

  titleInput.addEventListener("input", () => {
    if (titleInput.value.length > 26) {
      titleInput.value = titleInput.value.slice(0, 26);
    }
    titleFilled = titleInput.value.trim().length > 0;
    updateMainHelper();
    updateSubmitButton();
  });

  contentInput.addEventListener("input", () => {
    contentFilled = contentInput.value.trim().length > 0;
    updateMainHelper();
    updateSubmitButton();
  });

  deleteImageBtn.addEventListener("click", () => {
    // 서버에 보낼 이미지 경로 제거
    imageUrl = null;

    // UI 전환: 삭제 영역 숨기고 파일 선택 다시 노출
    currentImageRow.style.display = "none";
    fileRow.style.display = "block";

    // file input 초기화 + helper 문구
    imageInput.value = "";
    imageHelper.textContent = "파일을 선택해주세요.";
  });


  // 기존 게시글 정보 가져오기
  async function fetchPost() {
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.status !== 200 || data.detail !== "post_detail_success") {
        alert("게시글 정보를 불러오지 못했습니다.");
        window.location.href = "posts.html";
        return;
      }
      const post = data.data;
      titleInput.value = post.title;
      contentInput.value = post.content;
      imageUrl = post.image_url || null;

      titleFilled = !!post.title;
      contentFilled = !!post.content;
      updateMainHelper();
      updateSubmitButton();
      if (imageUrl) {
        // 기존 이미지가 있는 경우: 삭제 버튼 + 현재 이미지 텍스트만 보이게
        currentImageLabel.textContent = `현재 등록된 이미지: ${imageUrl}`;
        currentImageRow.style.display = "flex";
        fileRow.style.display = "none";          // 파일 선택 버튼 숨김
        imageHelper.textContent = "";            // helper는 일단 비워두기
      } else {
        // 기존 이미지가 없는 경우: 파일 선택 버튼만 보이게
        currentImageRow.style.display = "none";
        fileRow.style.display = "block";
        imageHelper.textContent = "파일을 선택해주세요.";
      }
    } catch (err) {
      console.error(err);
      alert("게시글 정보를 불러오지 못했습니다.");
      window.location.href = "posts.html";
    }
  }

  // 이미지 업로드 (변경)
  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) {
      // 파일 다시 선택 취소한 경우
      if (!imageUrl) {
        imageHelper.textContent = "파일을 선택해주세요.";
      }
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    imageHelper.textContent = "이미지를 업로드 중입니다...";

    try {
      const res = await fetch(`${API_BASE_URL}/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.status === 201) {
        const data = await res.json();
        if (data.data && data.data.file_path) {
          imageUrl = data.data.file_path;
          imageHelper.textContent = ""; 
        } else {
          imageUrl = null;
          setHelper(
            imageHelper,
            "이미지 업로드 중 오류가 발생했습니다.",
            "error"
          );
        }
      } else {
        imageUrl = null;
        setHelper(
          imageHelper,
          "이미지 업로드 중 오류가 발생했습니다.",
          "error"
        );
      }
    } catch (err) {
      imageUrl = null;
      setHelper(
        imageHelper,
        "이미지 업로드 중 오류가 발생했습니다.",
        "error"
      );
    }
  });

  // 수정하기
  submitBtn.addEventListener("click", async () => {
    if (!titleFilled || !contentFilled) {
      updateMainHelper();
      return;
    }

    const payload = {
      user_id: user.user_id,
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      image_url: imageUrl,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 200 && data.detail === "post_update_success") {
        window.location.href = `post_detail.html?postId=${postId}`;
      } else {
        alert("게시글 수정에 실패했습니다. (" + (data.detail || res.status) + ")");
      }
    } catch (err) {
      console.error(err);
      alert("게시글 수정 중 오류가 발생했습니다.");
    }
  });

  await fetchPost();
}

// ---------- 게시글 상세조회 페이지 ----------
async function initPostDetailPage() {
  const user = initAuthedPage();
  if (!user) return;

  const postId = getQueryParam("postId");
  if (!postId) {
    alert("잘못된 접근입니다.");
    window.location.href = "posts.html";
    return;
  }

  const backBtn = document.getElementById("detail-back-btn");
  backBtn.addEventListener("click", () => {
    window.location.href = "posts.html";
  });

  const titleEl = document.getElementById("detail-title");
  const authorEl = document.getElementById("detail-author");
  const dateEl = document.getElementById("detail-date");
  const imgWrapper = document.getElementById("detail-image-wrapper");
  const imgEl = document.getElementById("detail-image");
  const contentEl = document.getElementById("detail-content");
  const likePill = document.getElementById("like-pill");
  const likeCountEl = document.getElementById("like-count");
  const viewCountEl = document.getElementById("view-count");
  const commentCountEl = document.getElementById("comment-count");
  const ownerActions = document.getElementById("post-owner-actions");
  const editBtn = document.getElementById("post-edit-btn");
  const deleteBtn = document.getElementById("post-delete-btn");
  const deleteModal = document.getElementById("post-delete-modal");
  const deleteCancel = document.getElementById("post-delete-cancel");
  const deleteConfirm = document.getElementById("post-delete-confirm");

  const commentTextarea = document.getElementById("comment-textarea");
  const commentSubmitBtn = document.getElementById("comment-submit-btn");
  const commentsList = document.getElementById("comments-list");

  // 댓글 삭제 모달
  const commentDeleteModal = document.getElementById("comment-delete-modal");
  const commentDeleteCancel = document.getElementById("comment-delete-cancel");
  const commentDeleteConfirm = document.getElementById("comment-delete-confirm");

  let liked = false;
  let likeId = null;
  let likeCount = 0;
  let totalCommentCount = 0;

  let editingCommentId = null; // null이면 새 댓글 모드
  let pendingDeleteCommentId = null;

  function updateLikeUI() {
    likeCountEl.textContent = formatCount(likeCount);
    if (liked) {
      likePill.classList.add("liked");
    } else {
      likePill.classList.remove("liked");
    }
  }

  function updateCommentButtonState() {
    const hasText = commentTextarea.value.trim().length > 0;
    if (hasText) {
      commentSubmitBtn.classList.add("active");
      commentSubmitBtn.disabled = false;
    } else {
      commentSubmitBtn.classList.remove("active");
      commentSubmitBtn.disabled = true;
    }
  }

  commentTextarea.addEventListener("input", updateCommentButtonState);

  // 상세 조회 API 호출
  async function fetchPostDetail() {
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.status !== 200 || data.detail !== "post_detail_success") {
        console.error("detail error:", res.status, data);
        alert("게시글을 불러오지 못했습니다.");
        window.location.href = "posts.html";
        return;
      }

      const post = data.data;

      titleEl.textContent = post.title;
      authorEl.textContent = post.author_nickname;
      dateEl.textContent = post.created_at; // 서버 포맷 그대로 사용
      contentEl.textContent = post.content;

      if (post.image_url) {
        imgWrapper.style.display = "block";
        imgEl.src = post.image_url;
      } else {
        imgWrapper.style.display = "none";
      }

      likeCount = post.likes || 0;
      liked = !!post.is_liked_by_me;
      likeId = post.is_liked_by_me ? post.like_id : null;
      totalCommentCount = post.comments_count || 0;

      updateLikeUI();
      viewCountEl.textContent = formatCount(post.views || 0);
      commentCountEl.textContent = formatCount(totalCommentCount);

      // 작성자 본인인 경우 수정/삭제 버튼 보여주기
      if (Number(post.author_user_id) === Number(user.user_id)) {
        ownerActions.style.display = "flex";
      } else {
        ownerActions.style.display = "none";
      }

      // 댓글 렌더링
      renderComments(post.comments || []);
    } catch (err) {
      console.error(err);
      alert("게시글을 불러오지 못했습니다.");
      window.location.href = "posts.html";
    }
  }

  function renderComments(comments) {
    commentsList.innerHTML = "";
    comments.forEach((c) => {
      const item = document.createElement("div");
      item.className = "comment-item";
      item.dataset.commentId = c.comment_id;

      const avatar = document.createElement("div");
      avatar.className = "comment-avatar";

      if (c.author_profile_image) {
        const img = document.createElement("img");
        img.src = c.author_profile_image;
        img.alt = c.author_nickname || "author";
        avatar.appendChild(img);
      } else {
        const span = document.createElement("span");
        span.className = "comment-avatar-initial";
        span.textContent = (c.author_nickname?.[0] || "U").toUpperCase();
        avatar.appendChild(span);
      }

      const body = document.createElement("div");
      body.className = "comment-body";

      const headerRow = document.createElement("div");
      headerRow.className = "comment-header-row";

      const left = document.createElement("div");
      const authorSpan = document.createElement("span");
      authorSpan.className = "comment-author";
      authorSpan.textContent = c.author_nickname;
      const dateSpan = document.createElement("span");
      dateSpan.className = "comment-meta";
      dateSpan.textContent = " · " + c.created_at;
      left.appendChild(authorSpan);
      left.appendChild(dateSpan);

      const right = document.createElement("div");
      right.className = "comment-meta";

      headerRow.appendChild(left);
      headerRow.appendChild(right);

      const content = document.createElement("div");
      content.className = "comment-content";
      content.textContent = c.content;

      body.appendChild(headerRow);
      body.appendChild(content);

      // 내 댓글이면 수정/삭제 버튼
      if (Number(c.user_id) === Number(user.user_id)) {
        const actionsRow = document.createElement("div");
        actionsRow.className = "comment-actions-row";

        const editBtn = document.createElement("button");
        editBtn.textContent = "수정";
        editBtn.addEventListener("click", () => {
          editingCommentId = c.comment_id;
          commentTextarea.value = c.content;
          commentSubmitBtn.textContent = "댓글 수정";
          updateCommentButtonState();
          commentTextarea.focus();
        });

        const delBtn = document.createElement("button");
        delBtn.textContent = "삭제";
        delBtn.addEventListener("click", () => {
          pendingDeleteCommentId = c.comment_id;
          commentDeleteModal.classList.add("show");
          document.body.style.overflow = "hidden";
        });

        actionsRow.appendChild(editBtn);
        actionsRow.appendChild(delBtn);
        body.appendChild(actionsRow);
      }

      item.appendChild(avatar);
      item.appendChild(body);
      commentsList.appendChild(item);
    });
  }

  // 좋아요 토글
  likePill.addEventListener("click", async () => {
    try {
      if (!liked) {
        const res = await fetch(`${API_BASE_URL}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            post_id: Number(postId),
            user_id: user.user_id,
          }),
        });
        const data = await res.json();
        if (res.status === 201 && data.detail === "like_create_success") {
          liked = true;
          likeId = data.data.like_id;
          likeCount += 1;
          updateLikeUI();
        } else {
          alert("좋아요 등록에 실패했습니다.");
        }
      } else {
        if (!likeId) return;
        const res = await fetch(`${API_BASE_URL}/like/${likeId}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json();
        if (res.status === 200 && data.detail === "like_delete_success") {
          liked = false;
          likeId = null;
          likeCount = Math.max(0, likeCount - 1);
          updateLikeUI();
        } else {
          alert("좋아요 취소에 실패했습니다.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  });

  // 댓글 등록 / 수정
  commentSubmitBtn.addEventListener("click", async () => {
    const text = commentTextarea.value.trim();
    if (!text) {
      updateCommentButtonState();
      return;
    }

    try {
      if (editingCommentId == null) {
        // 새 댓글
        const res = await fetch(`${API_BASE_URL}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            post_id: Number(postId),
            user_id: user.user_id,
            content: text,
          }),
        });
        const data = await res.json();
        if (res.status === 201 && data.detail === "comment_create_success") {
          commentTextarea.value = "";
          commentSubmitBtn.textContent = "댓글 등록";
          editingCommentId = null;
          totalCommentCount += 1;
          commentCountEl.textContent = formatCount(totalCommentCount);
          await fetchPostDetail(); // 새로고침
        } else {
          alert("댓글 등록에 실패했습니다.");
        }
      } else {
        // 댓글 수정
        const res = await fetch(
          `${API_BASE_URL}/comment/${editingCommentId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content: text }),
          }
        );
        const data = await res.json();
        if (res.status === 200 && data.detail === "comment_update_success") {
          commentTextarea.value = "";
          commentSubmitBtn.textContent = "댓글 등록";
          editingCommentId = null;
          await fetchPostDetail();
        } else {
          alert("댓글 수정에 실패했습니다.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("댓글 처리 중 오류가 발생했습니다.");
    } finally {
      updateCommentButtonState();
    }
  });

  // 댓글 삭제 모달
  commentDeleteCancel.addEventListener("click", () => {
    commentDeleteModal.classList.remove("show");
    document.body.style.overflow = "";
    pendingDeleteCommentId = null;
  });
  commentDeleteConfirm.addEventListener("click", async () => {
    if (!pendingDeleteCommentId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/comment/${pendingDeleteCommentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.status === 200 && data.detail === "comment_delete_success") {
        totalCommentCount = Math.max(0, totalCommentCount - 1);
        commentCountEl.textContent = formatCount(totalCommentCount);
        await fetchPostDetail();
      } else {
        alert("댓글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      commentDeleteModal.classList.remove("show");
      document.body.style.overflow = "";
      pendingDeleteCommentId = null;
    }
  });

  // 게시글 수정 버튼
  editBtn.addEventListener("click", () => {
    window.location.href = `post_edit.html?postId=${postId}`;
  });

  // 게시글 삭제 모달
  deleteBtn.addEventListener("click", () => {
    deleteModal.classList.add("show");
    document.body.style.overflow = "hidden";
  });
  deleteCancel.addEventListener("click", () => {
    deleteModal.classList.remove("show");
    document.body.style.overflow = "";
  });
  deleteConfirm.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.status === 200 && data.detail === "post_delete_success") {
        window.location.href = "posts.html";
      } else {
        alert("게시글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    } finally {
      deleteModal.classList.remove("show");
      document.body.style.overflow = "";
    }
  });

  // 초기화
  commentSubmitBtn.disabled = true;
  await fetchPostDetail();
  updateCommentButtonState();
}

// ---------- 페이지별 초기화 ----------

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "login") {
    initLoginPage();
  } else if (page === "signup") {
    initSignupPage();
  } else if (page === "posts") {
    initPostsPage();
  } else if (page === "profile-edit") {
    initProfileEditPage();
  } else if (page === "password-edit") {
    initPasswordEditPage();
  } else if (page === "create-post") {
    initCreatePostPage();
  } else if (page === "post-detail") {
    initPostDetailPage();
  } else if (page === "post-edit") {
    initPostEditPage();
  }
});
