# Manual Test Plan — MyEdSpace Core Journey

Target: `http://localhost:3000` (Docker Compose stack — nginx + NestJS + Postgres)
Tester: Claude Code, via Chrome DevTools MCP
Date: 2026-07-04, final re-run 2026-07-05 against this repo's dockerised stack (fresh volume, migrated + seeded on boot)

**Result: 23/23 passed (both runs).**

Status legend: ⬜ not run · ✅ pass · ❌ fail

| # | Area | Steps | Expected result | Status | Notes |
|---|------|-------|------------------|--------|-------|
| 1 | Product page | Load `/` | 3 courses shown (Maths, English, Science), each with subject, year range, £199, "Buy course" link | ✅ | All 3 cards rendered with correct subject/yearRange/price and working Buy links |
| 2 | Checkout — happy path | Click "Buy course" on English → fill parent email, student email, fake card fields → submit | Redirects to confirmation state showing invitation link for English | ✅ | Confirmation shown with invitation link `/onboard/57803d0e-059f-48b6-ae25-dd596c173ec7`, student email `manual.tester@example.com` |
| 3 | Checkout — validation | On checkout form, try submitting with an empty required field | Browser-native validation blocks submit | ✅ | Native "Please fill out this field" alert shown on parent email, form stayed on page |
| 4 | Invitation → onboarding (new student) | Click "Continue to student onboarding" from confirmation | Onboarding form shown: full name, password, confirm password, addressed to the course + student email | ✅ | Correctly addressed to English / manual.tester@example.com |
| 5 | Onboarding — password mismatch | Fill onboarding form with mismatched password/confirm | Inline error "Passwords do not match", no navigation | ✅ | Exact error text shown, stayed on onboarding page, form values retained |
| 6 | Onboarding — happy path | Fill valid name + matching password (8+ chars), submit | Redirects to `/lms`, dashboard shows the purchased course | ✅ | Redirected to /lms, "Welcome back, Manual Tester", English course card shown |
| 7 | Invitation reuse | Revisit the same invitation link used in test 6 | Shows "This invitation has already been used" with link to log in | ✅ | Exact message + "Log in instead →" link to /login |
| 8 | Invalid invitation token | Visit `/onboard/not-a-real-token` | Shows "This invitation link is invalid." with link back home | ✅ | Exact message + "Back to home" link |
| 9 | Second course, same student (multi-enrollment) | Buy Maths as parent, using the *same* student email from test 6, follow invitation | Onboarding shows "Welcome back!" simplified panel (no password fields) instead of full form | ✅ | "Welcome back!" panel with no name/password fields, just a single confirm button |
| 10 | Multi-enrollment activation | Click "Add course to my account" from test 9 | Redirects to `/lms`; dashboard now lists both English and Maths | ✅ | Both course cards present, still "Manual Tester" |
| 11 | LMS dashboard → course lessons | Click into a course card from the dashboard | Lessons list shown (4 lessons), each marked "Not started" | ✅ | English: Reading Comprehension, Creative Writing, Grammar and Punctuation, Persuasive Writing — all "Not started" |
| 12 | Lesson detail | Click a lesson | Shows title, description, full content body, and "Mark as complete" button | ✅ | "Reading Comprehension" with full content paragraph and Mark as complete button |
| 13 | Mark lesson complete | Click "Mark as complete" | Button replaced with "✓ Lesson completed"; badge persists on reload | ✅ | Badge shown immediately and still shown after a hard page reload (server-persisted, not just local state) |
| 14 | Lesson completion reflected in list | Navigate back to the course's lesson list | The completed lesson now shows a "Completed" badge instead of "Not started" | ✅ | "Reading Comprehension" shows "Completed", other 3 lessons still "Not started" |
| 15 | Logout | Click "Log out" in header | Redirects away from LMS; header shows "Student log in" again | ✅ | Landed on /login (via ProtectedRoute redirect), header shows "Student log in" |
| 16 | Protected route redirect | While logged out, navigate directly to `/lms` | Redirected to `/login` (not shown blank/error) | ✅ | Browser tab URL became /login immediately |
| 17 | Login — wrong password | On `/login`, enter a valid student email with a wrong password | Inline error shown, stays on login page | ✅ | "Invalid email or password" shown, stayed on /login |
| 18 | Login — happy path | Enter correct email/password from test 6 | Redirects to `/lms`, dashboard loads with both enrolled courses | ✅ | Redirected to /lms, both English and Maths shown |
| 19 | Session persistence | After logging in, reload the `/lms` page (hard refresh) | Still authenticated, dashboard loads without redirect to login | ✅ | Reload kept dashboard state, no redirect to /login |
| 20 | Deep-link SPA reload | While logged in, hard-refresh a nested URL e.g. `/lms/courses/:id` directly | Page loads correctly (nginx `try_files` fallback serves the SPA, not a 404) | ✅ | Maths lessons list rendered correctly on full reload, no 404 |
| 21 | Direct URL access control (403) | While logged in as the test student, manually navigate to `/lms/courses/:scienceCourseId` for a course never purchased | Page shows "You do not have access to this course." (backend 403) | ✅ | Exact message shown for Science, which this student never purchased |
| 22 | Direct URL access control (401) | Clear `localStorage` token via DevTools, then reload an LMS page | Kicked back to a logged-out state; API calls return 401 | ✅ | Even stronger than expected: client-side ProtectedRoute redirected straight to /login on reload before any API call was attempted (backend would 401 on direct API access, confirmed earlier via curl and e2e tests) |
| 23 | Checkout for a course not yet visited | Directly visit `/checkout/:courseId` for the third course (Science) without clicking from the product page | Checkout form loads correctly with the right course name/price | ✅ | Science ( Year 5 → 11 ) — £199 loaded correctly via direct URL, logged-out header shown correctly too |
