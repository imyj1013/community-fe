# **Community Frontend (Vanilla JS)**

## 개요

이 프론트엔드는 Vanilla JavaScript 기반으로 개발된 단일 페이지 구조 웹 클라이언트입니다.
FastAPI 백엔드의 REST API를 호출하여 로그인, 게시글 목록 조회, 게시글 상세조회, 댓글/좋아요 기능 등 다양한 UI 상호작용을 제공합니다.

프레임워크를 사용하지 않고 상호작용을 직접 구현했기 때문에 DOM 제어, fetch 통신, 유효성 검사 로직 등이 명확하게 표현되어 있습니다.

---

# **시연영상**

https://drive.google.com/file/d/16yCrMHfZRHSoyG99GfKu6IIlS5KXJN1I/view?usp=sharing 

---
| 로그인 | 회원가입 | 개인정보수정 |
|---|---|---|
| <img width="1119" height="785" alt="Image" src="https://github.com/user-attachments/assets/e0b407b0-bd36-45e1-96bd-edb3297c08e2" /> | <img width="1118" height="786" alt="Image" src="https://github.com/user-attachments/assets/61b9f54f-c7c4-4eda-ae24-84c9012b1a7c" /> | <img width="1121" height="786" alt="Image" src="https://github.com/user-attachments/assets/471465b7-250b-4955-a4a7-ecb09e8f11aa" /> |

| 비밀번호수정 | 게시글목록 | 게시글상세조회 |
|---|---|---|
| <img width="1119" height="786" alt="Image" src="https://github.com/user-attachments/assets/b0efd852-90d5-4ba5-93f7-1b689efa0d7b" /> | <img width="1109" height="780" alt="Image" src="https://github.com/user-attachments/assets/d7ec5bea-31c4-4f36-a953-1e29de66df33" /> | <img width="1122" height="789" alt="Image" src="https://github.com/user-attachments/assets/e2d8acfb-ec6d-4832-a258-54991e540dfc" /> |


---

## 실행 방법

### 1) 정적 서버 실행

프론트는 단순 HTML 파일이므로 Python 내장 서버만 있어도 실행 가능하다.

```bash
cd frontend
python -m http.server 5500
```

브라우저에서:

```
http://localhost:5500/login.html
```

접속.

---

## 주요 기능 설명

### API 통신(fetch)

모든 서버 요청은 다음 형태로 이루어진다:

```javascript
fetch(`${API_BASE_URL}/user/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email, password })
});
```

세션 기반 인증을 위해 모든 요청에 `credentials: "include"` 적용.

---

### 로그인 / 회원가입 유효성 검사

* 이메일 정규식 확인
* 비밀번호 패턴 검사
* 입력 포커스 아웃 시 실시간 helper text 표시
* 이메일/닉네임 중복검사 자동 요청

---

### 게시글 목록 페이지

* 인피니티 스크롤 구현
* 프로필 이미지 출력 또는 닉네임 첫글자 표시
* 1000 이상 숫자 1k, 10k, 100k 단위 표기
* 제목 26자 자동 잘림 처리
* 카드 클릭 시 상세페이지 이동

---

### 게시글 상세조회 페이지

* 게시글 본문 + 이미지 출력
* 좋아요 toggle UI 적용
* 댓글 작성자 프로필 노출
* 댓글 수정/삭제 UI 구성
* 본인 작성 게시글이면 수정/삭제 버튼 표시

---

### 게시글 수정

* 기존 이미지가 있으면 “현재 등록된 이미지” + 삭제 버튼 표시
* 이미지 삭제 시 imageUrl 변수를 null로 설정하여 서버 반영

---

### 댓글 기능

* 본인 댓글만 수정/삭제 가능 (user_id 기반)
* 수정 시 textarea에 기존 내용 불러오기
* 삭제 모달 UI 구현

---

### 마이페이지 기능

* 닉네임 변경
* 프로필 이미지 수정/삭제
* 회원 탈퇴(모달)

---

## UI/UX 요소

* 동그란 프로필 이미지 영역
* 이미지 없는 경우 닉네임 첫 글자를 중앙에 배치
* 버튼 색상 전환(비활성 → 활성)
* 모든 모달은 body scroll lock 적용

---

## 예외 처리

* 서버 오류 시 alert 메시지 출력
* 인증이 만료되면 자동 로그아웃 처리
* 데이터 없는 경우 빈 UI 표시

---
