import { useEffect, useState } from 'react'
import './App.css'

const configuredApiBaseUrl = import.meta.env.VITE_API_URL?.trim() || ''
const API_BASE_URL = import.meta.env.DEV ? '' : configuredApiBaseUrl
const FACEBOOK_PAGE_URL = import.meta.env.VITE_FACEBOOK_PAGE_URL?.trim() || ''
const USER_TOKEN_KEY = 'floorcraft_user_token'

const initialProjectForm = { name: '', type: 'LAMINATE', image: '', area: '', location: '', installedAt: '', description: '', featured: false }
const initialAdminPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' }
const initialUserRegisterForm = { email: '', phone: '', username: '', password: '' }
const initialUserLoginForm = { login: '', password: '' }
const initialReviewForm = { rating: '5', title: '', comment: '' }

function getRoute() {
  if (window.location.pathname.startsWith('/admin')) return 'admin'
  if (window.location.pathname.startsWith('/members')) return 'members'
  if (window.location.pathname.startsWith('/projects')) return 'projects'
  if (window.location.pathname.startsWith('/reviews')) return 'reviews'
  return 'dashboard'
}

function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function getStoredToken(key) {
  return window.localStorage.getItem(key) || ''
}

function setStoredToken(key, token) {
  if (token) {
    window.localStorage.setItem(key, token)
    return
  }

  window.localStorage.removeItem(key)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('th-TH', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(dateString))
}

async function parseResponse(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const data = await parseResponse(response)
  if (!response.ok) {
    throw new Error(data?.details || data?.message || 'Request failed')
  }
  return data
}

function PublicNav() {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => navigateTo('/')}><span>FC</span>FloorCraft</button>
      <nav className="site-nav">
        <button className="btn-secondary" type="button" onClick={() => navigateTo('/')}>หน้าหลัก</button>
        <button className="btn-secondary" type="button" onClick={() => navigateTo('/projects')}>ผลงาน</button>
        <button className="btn-secondary" type="button" onClick={() => navigateTo('/reviews')}>รีวิว</button>
        <button className="btn-secondary" type="button" onClick={() => navigateTo('/members')}>สมาชิก</button>
        <button className="btn-secondary" type="button" onClick={() => navigateTo('/admin')}>เข้าสู่ระบบ</button>
      </nav>
    </header>
  )
}

function ProjectGrid({ projects }) {
  return (
    <div className="projects-grid">
      {projects.map((project) => (
        <article key={project._id} className="project-card glass glass-card">
          <div className="project-img-container"><img src={project.image} alt={project.name} className="project-img" /></div>
          <div className="project-details">
            <div className="project-card-head">
              <h3>{project.name}</h3>
              {project.featured ? <span className="project-badge">เด่น</span> : null}
            </div>
            <p>{project.description}</p>
            <div className="project-meta">
              <div className="meta-item">{project.area} ตร.ม.</div>
              <div className="meta-item">{project.location}</div>
              <div className="meta-item">{formatDate(project.installedAt)}</div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function ReviewGrid({ reviews }) {
  return (
    <div className="customer-list">
      {reviews.map((review) => (
        <article key={review._id} className="glass glass-card customer-card">
          <div className="customer-head">
            <div><h3>{review.title}</h3><p>โดย {review.username}</p></div>
            <div className="customer-meta">{review.rating}/5</div>
          </div>
          <div className="customer-body">
            <div>{review.comment}</div>
            <div>{formatDate(review.createdAt)}</div>
          </div>
        </article>
      ))}
    </div>
  )
}

function DashboardPage(props) {
  const { loading, projects, reviews, user } = props
  const featuredProjects = projects.filter((project) => project.featured).slice(0, 3)
  const latestReviews = reviews.slice(0, 3)

  return (
    <div className="site-shell animate-fade-in">
      <PublicNav />
      <main className="site-main">
        <section className="hero-panel glass">
          <div className="hero-copy">
            <p className="eyebrow">Featured Dashboard</p>
            <h1>รวมผลงานเด่น รีวิวล่าสุด และทางเข้าพื้นที่สมาชิกในหน้าเดียว</h1>
            <p className="hero-text">หน้า dashboard จะแสดงเฉพาะผลงานเด่น 3 รายการที่แอดมินเลือกไว้ เพื่อให้หน้าแรกชัดและโฟกัสมากขึ้น</p>
            <div className="hero-actions">
              <button className="btn-primary" type="button" onClick={() => navigateTo('/members')}>สมัครสมาชิก</button>
              <button className="btn-secondary" type="button" onClick={() => navigateTo('/projects')}>ดูผลงานทั้งหมด</button>
              <button className="btn-secondary" type="button" onClick={() => navigateTo('/reviews')}>ดูรีวิวทั้งหมด</button>
              <a className="btn-secondary" href="https://web.facebook.com/profile.php?id=61560758349405" target="_blank" rel="noopener noreferrer">Page FaceBook</a>
            </div>
          </div>
          <div className="hero-stats">
            <article className="glass stat-tile"><span>ผลงาน</span><strong>{projects.length}</strong></article>
            <article className="glass stat-tile"><span>รีวิว</span><strong>{reviews.length}</strong></article>
            <article className="glass stat-tile"><span>สมาชิก</span><strong>{user ? user.username : 'ยังไม่เข้าสู่ระบบ'}</strong></article>
          </div>
        </section>

        <section className="site-section">
          <div className="site-section-head">
            <div><p className="eyebrow">Featured Projects</p><h2>ผลงานเด่น 3 รายการ</h2></div>
            <button className="btn-secondary" type="button" onClick={() => navigateTo('/projects')}>ไปหน้าผลงาน</button>
          </div>
          {loading ? <div className="glass loading-panel">กำลังโหลดผลงาน...</div> : featuredProjects.length === 0 ? <div className="glass loading-panel">ยังไม่ได้ตั้งค่าผลงานเด่น</div> : <ProjectGrid projects={featuredProjects} />}
        </section>

        <section className="site-section">
          <div className="site-section-head">
            <div><p className="eyebrow">Latest Reviews</p><h2>รีวิวล่าสุด</h2></div>
            <button className="btn-secondary" type="button" onClick={() => navigateTo('/reviews')}>ไปหน้ารีวิว</button>
          </div>
          {loading ? <div className="glass loading-panel">กำลังโหลดรีวิว...</div> : latestReviews.length === 0 ? <div className="glass loading-panel">ยังไม่มีรีวิว</div> : <ReviewGrid reviews={latestReviews} />}
        </section>
      </main>
    </div>
  )
}

function ProjectsPage(props) {
  const { loading, projects } = props

  return (
    <div className="site-shell animate-fade-in">
      <PublicNav />
      <main className="site-main">
        <section className="listing-hero glass">
          <p className="eyebrow">All Projects</p>
          <h1>หน้าผลงานทั้งหมด</h1>
          <p className="hero-text">รวมทุกผลงานในระบบ โดยแยกออกจากหน้า dashboard ให้เรียกดูได้เต็มที่มากขึ้น</p>
        </section>
        <section className="site-section">
          {loading ? <div className="glass loading-panel">กำลังโหลดผลงาน...</div> : <ProjectGrid projects={projects} />}
        </section>
      </main>
    </div>
  )
}

function ReviewsPage(props) {
  const { loading, reviews } = props

  return (
    <div className="site-shell animate-fade-in">
      <PublicNav />
      <main className="site-main">
        <section className="listing-hero glass">
          <p className="eyebrow">All Reviews</p>
          <h1>หน้ารีวิวทั้งหมด</h1>
          <p className="hero-text">รวมรีวิวจากสมาชิกทั้งหมดในหน้าแยก เพื่อให้อ่านง่ายและไม่อัดรวมกับหน้าผลงาน</p>
        </section>
        <section className="site-section">
          {loading ? <div className="glass loading-panel">กำลังโหลดรีวิว...</div> : reviews.length === 0 ? <div className="glass loading-panel">ยังไม่มีรีวิว</div> : <ReviewGrid reviews={reviews} />}
        </section>
      </main>
    </div>
  )
}

function MemberAuthPage(props) {
  const {
    user,
    reviews,
    authMode,
    userError,
    userSuccess,
    registerForm,
    userLoginForm,
    reviewForm,
    userSubmitting,
    reviewSubmitting,
    deletingReviewId,
    onRegisterChange,
    onRegisterSubmit,
    onUserLoginChange,
    onUserLoginSubmit,
    onUserLogout,
    onReviewChange,
    onReviewSubmit,
    onReviewDelete,
  } = props
  const myReviews = user
    ? reviews.filter((review) => String(review.userId) === String(user.id || user._id))
    : []
  const memberStats = [
    { label: 'รีวิวทั้งหมด', value: reviews.length },
    { label: 'รีวิวของฉัน', value: myReviews.length },
    { label: 'สถานะสมาชิก', value: user ? 'ออนไลน์' : 'Guest' },
  ]
  const isAdminAccessMode = authMode === 'admin'

  if (isAdminAccessMode && !user) {
    return (
      <div className="site-shell animate-fade-in">
        <PublicNav />
        <div className="auth-shell">
          <div className="auth-card glass glass-card animate-fade-in auth-card-wide">
          {userError ? <div className="feedback-banner error-banner">{userError}</div> : null}
          {userSuccess ? <div className="feedback-banner success-banner">{userSuccess}</div> : null}
          <div className="member-auth-grid member-auth-grid-compact" id="member-auth-grid">
            <section className="glass glass-card member-form-card">
              <div className="section-title"><h2>สมัครสมาชิก</h2></div>
              <form className="project-form" onSubmit={onRegisterSubmit}>
                <label>อีเมล<input name="email" value={registerForm.email} onChange={onRegisterChange} required /></label>
                <label>เบอร์โทรศัพท์<input name="phone" value={registerForm.phone} onChange={onRegisterChange} required /></label>
                <label>ชื่อผู้ใช้<input name="username" value={registerForm.username} onChange={onRegisterChange} required /></label>
                <label>รหัสผ่าน<input name="password" type="password" minLength="8" value={registerForm.password} onChange={onRegisterChange} required /></label>
                <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={userSubmitting}>{userSubmitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button></div>
              </form>
            </section>
            <section className="glass glass-card member-form-card">
              <div className="section-title"><h2>เข้าสู่ระบบ</h2></div>
              <form className="project-form" onSubmit={onUserLoginSubmit}>
                <label className="full-width">อีเมลหรือชื่อผู้ใช้<input name="login" value={userLoginForm.login} onChange={onUserLoginChange} required /></label>
                <label className="full-width">รหัสผ่าน<input name="password" type="password" value={userLoginForm.password} onChange={onUserLoginChange} required /></label>
                <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={userSubmitting}>{userSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button></div>
              </form>
            </section>
          </div>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="member-shell animate-fade-in">
      <header className="member-topbar">
        <button className="brand" type="button" onClick={() => navigateTo('/')}><span>FC</span>FloorCraft</button>
        <div className="member-topbar-actions">
          <button className="btn-secondary" type="button" onClick={() => navigateTo('/')}>กลับหน้าแรก</button>
          {user ? <button className="btn-primary" type="button" onClick={onUserLogout}>ออกจากระบบ</button> : null}
        </div>
      </header>
      <main className="member-main">
        <section className="member-hero glass">
          <div className="member-hero-copy">
            <p className="eyebrow">{isAdminAccessMode && !user ? 'Admin Access' : 'Members Space'}</p>
            <h1>{user ? `ยินดีต้อนรับกลับ, ${user.username}` : isAdminAccessMode ? 'เข้าสู่ระบบจากหน้าเดียวกัน แล้วระบบจะพาไปตามสิทธิ์ของคุณ' : 'พื้นที่สมาชิกสำหรับรีวิวและติดตามผลงาน'}</h1>
            <p className="member-hero-text">
              {user
                ? 'จัดการรีวิวของคุณจากหน้าเดียว ส่งรีวิวใหม่ หรือลบรายการเดิมได้ทันที'
                : isAdminAccessMode
                  ? 'หน้านี้เป็นศูนย์กลางสำหรับสมัครสมาชิกและเข้าสู่ระบบทั้งหมด หากบัญชีของคุณมี role เป็น admin ระบบจะพาเข้าหลังบ้านทันทีหลังเข้าสู่ระบบ'
                  : 'หน้าสมาชิกใช้สำหรับการใช้งานหลังเข้าสู่ระบบ หากยังไม่มีบัญชีหรือยังไม่ได้ล็อกอิน ให้ไปที่หน้าแอดมินเพื่อสมัครสมาชิกหรือเข้าสู่ระบบ'}
            </p>
            <div className="member-hero-actions">
              {!user ? <button className="btn-primary" type="button" onClick={() => isAdminAccessMode ? document.getElementById('member-auth-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : navigateTo('/admin')}>{isAdminAccessMode ? 'เริ่มใช้งาน' : 'เข้าสู่ระบบ'}</button> : null}
              <button className="btn-secondary" type="button" onClick={() => document.getElementById('member-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>ดูพื้นที่สมาชิก</button>
            </div>
          </div>
          <div className="member-hero-stats">
            {memberStats.map((item) => (
              <article key={item.label} className="glass member-stat-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="member-content" id="member-content">
          {userError ? <div className="feedback-banner error-banner">{userError}</div> : null}
          {userSuccess ? <div className="feedback-banner success-banner">{userSuccess}</div> : null}
          {!user ? (
            <div className="member-auth-grid" id="member-auth-grid">
              <section className="glass glass-card member-info-panel">
                <p className="eyebrow">Benefits</p>
                <h2>{isAdminAccessMode ? 'หน้าเข้าสู่ระบบเดียวสำหรับทุกบทบาท' : 'พื้นที่สมาชิกหลังเข้าสู่ระบบ'}</h2>
                <p className="member-panel-text">{isAdminAccessMode ? 'สมัครสมาชิกและล็อกอินจากหน้านี้ได้เลย หาก role เป็น admin ระบบจะพาเข้าสู่หลังบ้านโดยอัตโนมัติ' : 'เมื่อเข้าสู่ระบบแล้ว คุณจะมีพื้นที่สำหรับส่งรีวิว ดูรีวิวของตัวเอง และจัดการข้อมูลได้ในหน้าเดียวแบบเต็มจอ'}</p>
                <div className="member-feature-list">
                  <article className="member-feature-card">
                    <h3>ส่งรีวิวได้เร็ว</h3>
                    <p>ฟอร์มขนาดเต็ม อ่านง่าย ใช้งานสะดวกทั้งบนคอมและมือถือ</p>
                  </article>
                  <article className="member-feature-card">
                    <h3>จัดการรีวิวของตัวเอง</h3>
                    <p>ตรวจดูรายการทั้งหมดของคุณ และลบรีวิวที่ไม่ต้องการได้ทันที</p>
                  </article>
                  <article className="member-feature-card">
                    <h3>แยกจากหน้าแรกชัดเจน</h3>
                    <p>ลดความแน่นของ UI เดิม ให้หน้า public และหน้าสมาชิกมีบทบาทคนละแบบ</p>
                  </article>
                </div>
                {!isAdminAccessMode ? (
                  <div className="form-actions" style={{ marginTop: '20px' }}>
                    <button className="btn-primary" type="button" onClick={() => navigateTo('/admin')}>สมัคร/เข้าสู่ระบบ</button>
                  </div>
                ) : null}
              </section>
              {isAdminAccessMode ? (
                <section className="glass glass-card member-form-card">
                <div className="section-title"><h2>สมัครสมาชิก</h2></div>
                <form className="project-form" onSubmit={onRegisterSubmit}>
                  <label>อีเมล<input name="email" value={registerForm.email} onChange={onRegisterChange} required /></label>
                  <label>เบอร์โทรศัพท์<input name="phone" value={registerForm.phone} onChange={onRegisterChange} required /></label>
                  <label>ชื่อผู้ใช้<input name="username" value={registerForm.username} onChange={onRegisterChange} required /></label>
                  <label>รหัสผ่าน<input name="password" type="password" minLength="8" value={registerForm.password} onChange={onRegisterChange} required /></label>
                  <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={userSubmitting}>{userSubmitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button></div>
                </form>
                </section>
              ) : null}
              {isAdminAccessMode ? (
              <section className="glass glass-card member-form-card">
                <div className="section-title"><h2>เข้าสู่ระบบ</h2></div>
                <form className="project-form" onSubmit={onUserLoginSubmit}>
                  <label className="full-width">อีเมลหรือชื่อผู้ใช้<input name="login" value={userLoginForm.login} onChange={onUserLoginChange} required /></label>
                  <label className="full-width">รหัสผ่าน<input name="password" type="password" value={userLoginForm.password} onChange={onUserLoginChange} required /></label>
                  <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={userSubmitting}>{userSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button></div>
                </form>
              </section>
              ) : null}
            </div>
          ) : (
            <div className="member-dashboard-grid">
              <section className="glass glass-card member-profile-card">
                <div className="member-profile-head">
                  <div className="member-avatar">{user.username?.slice(0, 1)?.toUpperCase()}</div>
                  <div>
                    <p className="eyebrow">Profile</p>
                    <h2>{user.username}</h2>
                    <p className="member-panel-text">ข้อมูลสมาชิกและสรุปกิจกรรมของคุณ</p>
                  </div>
                </div>
                <div className="member-profile-meta">
                  <div><span>อีเมล</span><strong>{user.email}</strong></div>
                  <div><span>เบอร์โทรศัพท์</span><strong>{user.phone}</strong></div>
                  <div><span>รีวิวของฉัน</span><strong>{myReviews.length} รายการ</strong></div>
                </div>
              </section>
              <section className="glass glass-card member-review-form-card">
                <div className="section-title"><h2>ส่งรีวิว</h2></div>
                <form className="project-form" onSubmit={onReviewSubmit}>
                  <label>คะแนน<select name="rating" value={reviewForm.rating} onChange={onReviewChange}><option value="5">5 ดาว</option><option value="4">4 ดาว</option><option value="3">3 ดาว</option><option value="2">2 ดาว</option><option value="1">1 ดาว</option></select></label>
                  <label>หัวข้อรีวิว<input name="title" value={reviewForm.title} onChange={onReviewChange} required /></label>
                  <label className="full-width">ข้อความรีวิว<textarea name="comment" value={reviewForm.comment} onChange={onReviewChange} rows="4" required /></label>
                  <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={reviewSubmitting}>{reviewSubmitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิว'}</button></div>
                </form>
              </section>
              <section className="glass glass-card member-review-list-card">
                <div className="section-title"><h2>รีวิวของฉัน</h2></div>
                {myReviews.length === 0 ? (
                  <div className="member-empty-state">
                    <strong>คุณยังไม่มีรีวิวในระบบ</strong>
                    <p>เมื่อส่งรีวิวแล้ว รายการของคุณจะมาแสดงที่ส่วนนี้ทันที</p>
                  </div>
                ) : (
                  <div className="member-review-list">
                    {myReviews.map((review) => (
                      <article key={review._id} className="glass glass-card member-review-card">
                        <div className="customer-head">
                          <div>
                            <h3>{review.title}</h3>
                            <p>{formatDate(review.createdAt)}</p>
                          </div>
                          <div className="customer-meta">{review.rating}/5</div>
                        </div>
                        <div className="customer-body">
                          <div>{review.comment}</div>
                        </div>
                        <div className="card-actions review-actions">
                          <button
                            className="btn-danger"
                            type="button"
                            onClick={() => onReviewDelete(review._id)}
                            disabled={deletingReviewId === review._id}
                          >
                            {deletingReviewId === review._id ? 'กำลังลบ...' : 'ลบรีวิว'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function AdminPage(props) {
  const { activeTab, adminUser, adminUsers, userRoleUpdatingId, error, successMessage, loading, projects, reviews, projectForm, editingProjectId, submittingProject, passwordForm, passwordSubmitting, onTabChange, onProjectChange, onProjectSubmit, onProjectEdit, onProjectDelete, onProjectReset, onPasswordChange, onPasswordSubmit, onUserRoleChange, onLogout } = props
  const featuredProjectsCount = projects.filter((project) => project.featured).length
  return (
    <div className="layout-container animate-fade-in">
      <aside className="sidebar">
        <div className="logo delay-1"><span>FC</span> FloorCraft</div>
        <nav className="nav-menu delay-2">
          <button className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => onTabChange('projects')}>ผลงาน</button>
          <button className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => onTabChange('reviews')}>รีวิวลูกค้า</button>
          <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => onTabChange('users')}>จัดการสิทธิ์</button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => onTabChange('settings')}>รหัสผ่านแอดมิน</button>
        </nav>
        <div className="user-profile delay-3"><div className="user-avatar">{adminUser?.username?.slice(0, 1)?.toUpperCase() || 'A'}</div><div className="user-info"><div className="name">{adminUser?.username}</div><div className="role">{adminUser?.role || 'admin'}</div></div></div>
      </aside>
      <main className="main-content">
        <header className="header delay-1">
          <div className="header-title"><h1>ระบบจัดการแอดมิน</h1><p>ดูรีวิวอย่างเดียว และจัดการเฉพาะผลงาน</p></div>
          <div className="header-actions"><button className="btn-secondary" type="button" onClick={() => navigateTo('/')}>หน้าเว็บ</button><button className="btn-secondary" type="button" onClick={onLogout}>ออกจากระบบ</button></div>
        </header>
        {error ? <div className="feedback-banner error-banner">{error}</div> : null}
        {successMessage ? <div className="feedback-banner success-banner">{successMessage}</div> : null}
        {activeTab === 'projects' ? (
          <>
            <section className="glass glass-card form-panel">
              <div className="section-title"><h2>{editingProjectId ? 'แก้ไขผลงาน' : 'เพิ่มผลงาน'}</h2>{editingProjectId ? <button className="btn-secondary" type="button" onClick={onProjectReset}>ยกเลิก</button> : null}</div>
              <form className="project-form" onSubmit={onProjectSubmit}>
                <label>ชื่อผลงาน<input name="name" value={projectForm.name} onChange={onProjectChange} required /></label>
                <label>ประเภท<select name="type" value={projectForm.type} onChange={onProjectChange}><option value="LAMINATE">LAMINATE</option><option value="SPC">SPC</option></select></label>
                <label>รูปภาพ<input name="image" value={projectForm.image} onChange={onProjectChange} required /></label>
                <label>พื้นที่<input name="area" type="number" min="1" value={projectForm.area} onChange={onProjectChange} required /></label>
                <label>สถานที่<input name="location" value={projectForm.location} onChange={onProjectChange} required /></label>
                <label>วันที่ติดตั้ง<input name="installedAt" type="date" value={projectForm.installedAt} onChange={onProjectChange} required /></label>
                <label className={`project-checkbox ${projectForm.featured ? 'is-checked' : ''}`}>
                  <input name="featured" type="checkbox" checked={Boolean(projectForm.featured)} onChange={onProjectChange} />
                  <span className="project-checkbox-indicator" aria-hidden="true">
                    <span className="project-checkbox-knob" />
                  </span>
                  <span className="project-checkbox-copy">
                    <strong>ผลงานเด่นบนหน้า Dashboard</strong>
                    <span>ใช้สำหรับโปรโมตผลงานที่อยากให้แสดงหน้าแรกได้สูงสุด 3 รายการ</span>
                  </span>
                  <span className="project-checkbox-count">{projectForm.featured ? 'เลือกแล้ว' : `${featuredProjectsCount}/3`}</span>
                </label>
                <label className="full-width">รายละเอียด<textarea name="description" rows="4" value={projectForm.description} onChange={onProjectChange} required /></label>
                <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={submittingProject}>{submittingProject ? 'กำลังบันทึก...' : editingProjectId ? 'อัปเดตผลงาน' : 'เพิ่มผลงาน'}</button></div>
              </form>
            </section>
            {loading ? <div className="glass loading-panel">กำลังโหลดผลงาน...</div> : <div className="projects-grid">{projects.map((project) => <article key={project._id} className="project-card glass glass-card"><div className="project-img-container"><img src={project.image} alt={project.name} className="project-img" /></div><div className="project-details"><div className="project-card-head"><h3>{project.name}</h3>{project.featured ? <span className="project-badge">เด่น</span> : null}</div><p>{project.description}</p><div className="project-meta"><div className="meta-item">{project.area} ตร.ม.</div><div className="meta-item">{project.location}</div></div><div className="card-actions"><button className="btn-secondary" type="button" onClick={() => onProjectEdit(project)}>แก้ไข</button><button className="btn-danger" type="button" onClick={() => onProjectDelete(project._id)}>ลบ</button></div></div></article>)}</div>}
          </>
        ) : null}
        {activeTab === 'reviews' ? (loading ? <div className="glass loading-panel">กำลังโหลดรีวิว...</div> : <div className="customer-list">{reviews.map((review) => <article key={review._id} className="glass glass-card customer-card"><div className="customer-head"><div><h3>{review.title}</h3><p>โดย {review.username}</p></div><div className="customer-meta">{review.rating}/5</div></div><div className="customer-body"><div>{review.comment}</div><div>{formatDate(review.createdAt)}</div></div></article>)}</div>) : null}
        {activeTab === 'users' ? (
          <section className="glass glass-card form-panel">
            <div className="section-title"><h2>จัดการบทบาทผู้ใช้</h2></div>
            <div className="user-role-list">
              {adminUsers.map((account) => (
                <article key={account._id || account.id} className="user-role-card">
                  <div className="user-role-meta">
                    <strong>{account.username}</strong>
                    <span>{account.email}</span>
                    <span>{account.phone}</span>
                  </div>
                  <div className="user-role-actions">
                    <select value={account.role} onChange={(event) => onUserRoleChange(account, event.target.value)} disabled={userRoleUpdatingId === (account._id || account.id)}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <span className="user-role-status">{userRoleUpdatingId === (account._id || account.id) ? 'กำลังอัปเดต...' : account.role}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {activeTab === 'settings' ? (
          <section className="glass glass-card form-panel">
            <div className="section-title"><h2>เปลี่ยนรหัสผ่านแอดมิน</h2></div>
            <form className="project-form" onSubmit={onPasswordSubmit}>
              <label className="full-width">รหัสผ่านเดิม<input name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={onPasswordChange} required /></label>
              <label>รหัสผ่านใหม่<input name="newPassword" type="password" minLength="8" value={passwordForm.newPassword} onChange={onPasswordChange} required /></label>
              <label>ยืนยันรหัสผ่านใหม่<input name="confirmPassword" type="password" minLength="8" value={passwordForm.confirmPassword} onChange={onPasswordChange} required /></label>
              <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={passwordSubmitting}>{passwordSubmitting ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}</button></div>
            </form>
          </section>
        ) : null}
      </main>
    </div>
  )
}

function App() {
  const [route, setRoute] = useState(getRoute)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [reviews, setReviews] = useState([])
  const [adminUsers, setAdminUsers] = useState([])
  const [adminUser, setAdminUser] = useState(null)
  const [user, setUser] = useState(null)
  const [userToken, setUserToken] = useState(() => getStoredToken(USER_TOKEN_KEY))
  const [activeTab, setActiveTab] = useState('projects')
  const [error, setError] = useState('')
  const [userError, setUserError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [userSuccess, setUserSuccess] = useState('')
  const [projectForm, setProjectForm] = useState(initialProjectForm)
  const [editingProjectId, setEditingProjectId] = useState('')
  const [adminPasswordForm, setAdminPasswordForm] = useState(initialAdminPasswordForm)
  const [registerForm, setRegisterForm] = useState(initialUserRegisterForm)
  const [userLoginForm, setUserLoginForm] = useState(initialUserLoginForm)
  const [reviewForm, setReviewForm] = useState(initialReviewForm)
  const [userSubmitting, setUserSubmitting] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [deletingReviewId, setDeletingReviewId] = useState('')
  const [userRoleUpdatingId, setUserRoleUpdatingId] = useState('')
  const [submittingProject, setSubmittingProject] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const [projectsData, reviewsData] = await Promise.all([fetchJson('/api/projects'), fetchJson('/api/reviews')])
        setProjects(projectsData || [])
        setReviews(reviewsData || [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูลไม่สำเร็จ')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!userToken) return
    Promise.all([
      fetchJson('/api/auth/me', { headers: { Authorization: `Bearer ${userToken}` } }),
      fetchJson('/api/admin/users', { headers: { Authorization: `Bearer ${userToken}` } }).catch(() => []),
    ]).then(([meData, usersData]) => {
      setUser(meData.user)
      setAdminUser(meData.user.role === 'admin' ? meData.user : null)
      setAdminUsers(Array.isArray(usersData) ? usersData : [])
    }).catch(() => {
      setStoredToken(USER_TOKEN_KEY, '')
      setUserToken('')
      setUser(null)
      setAdminUser(null)
      setAdminUsers([])
    })
  }, [userToken])

  function resetProjectForm() {
    setProjectForm(initialProjectForm)
    setEditingProjectId('')
  }

  function handleChange(setter) {
    return (event) => {
      const { name, value, type, checked } = event.target
      setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    }
  }

  async function handleAdminPasswordSubmit(event) {
    event.preventDefault()
    try {
      const data = await fetchJson('/api/admin/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` }, body: JSON.stringify(adminPasswordForm) })
      setSuccessMessage(data.message || 'เปลี่ยนรหัสผ่านสำเร็จ')
      setAdminPasswordForm(initialAdminPasswordForm)
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  async function handleUserRegisterSubmit(event) {
    event.preventDefault()
    try {
      setUserSubmitting(true)
      setUserError('')
      const data = await fetchJson('/api/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerForm) })
      setStoredToken(USER_TOKEN_KEY, data.token)
      setUserToken(data.token)
      setUser(data.user)
      setRegisterForm(initialUserRegisterForm)
      setUserSuccess('สมัครสมาชิกสำเร็จ')
    } catch (registerError) {
      setUserError(registerError instanceof Error ? registerError.message : 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setUserSubmitting(false)
    }
  }

  async function handleUserLoginSubmit(event) {
    event.preventDefault()
    try {
      setUserSubmitting(true)
      setUserError('')
      const data = await fetchJson('/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userLoginForm) })
      setStoredToken(USER_TOKEN_KEY, data.token)
      setUserToken(data.token)
      setUser(data.user)
      setAdminUser(data.user.role === 'admin' ? data.user : null)
      setUserLoginForm(initialUserLoginForm)
      if (data.user.role === 'admin') {
        setUserSuccess('เข้าสู่ระบบแอดมินสำเร็จ')
        navigateTo('/admin')
      } else {
        setUserSuccess('เข้าสู่ระบบสมาชิกสำเร็จ')
        if (route === 'admin') {
          navigateTo('/members')
        }
      }
    } catch (loginError) {
      setUserError(loginError instanceof Error ? loginError.message : 'เข้าสู่ระบบสมาชิกไม่สำเร็จ')
    } finally {
      setUserSubmitting(false)
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault()
    try {
      setReviewSubmitting(true)
      setUserError('')
      const data = await fetchJson('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` }, body: JSON.stringify({ ...reviewForm, rating: Number(reviewForm.rating) }) })
      setReviews((current) => [data, ...current])
      setReviewForm(initialReviewForm)
      setUserSuccess('ส่งรีวิวสำเร็จ')
    } catch (reviewError) {
      setUserError(reviewError instanceof Error ? reviewError.message : 'ส่งรีวิวไม่สำเร็จ')
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function handleReviewDelete(reviewId) {
    if (!window.confirm('ต้องการลบรีวิวนี้ใช่หรือไม่?')) return

    try {
      setDeletingReviewId(reviewId)
      setUserError('')
      await fetchJson(`/api/reviews/${reviewId}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      })
      setReviews((current) => current.filter((review) => review._id !== reviewId))
      setUserSuccess('ลบรีวิวสำเร็จ')
    } catch (deleteError) {
      setUserError(deleteError instanceof Error ? deleteError.message : 'ลบรีวิวไม่สำเร็จ')
    } finally {
      setDeletingReviewId('')
    }
  }

  async function handleProjectSubmit(event) {
    event.preventDefault()
    try {
      setSubmittingProject(true)
      const data = await fetchJson(`/api/projects${editingProjectId ? `/${editingProjectId}` : ''}`, { method: editingProjectId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` }, body: JSON.stringify({ ...projectForm, area: Number(projectForm.area) }) })
      setProjects((current) => editingProjectId ? current.map((project) => (project._id === data._id ? data : project)) : [data, ...current])
      resetProjectForm()
      setSuccessMessage('บันทึกผลงานสำเร็จ')
    } catch (projectError) {
      setError(projectError instanceof Error ? projectError.message : 'บันทึกผลงานไม่สำเร็จ')
    } finally {
      setSubmittingProject(false)
    }
  }

  async function handleProjectDelete(projectId) {
    if (!window.confirm('ต้องการลบผลงานนี้ใช่หรือไม่?')) return
    try {
      await fetchJson(`/api/projects/${projectId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${userToken}` } })
      setProjects((current) => current.filter((project) => project._id !== projectId))
      setSuccessMessage('ลบผลงานสำเร็จ')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'ลบผลงานไม่สำเร็จ')
    }
  }

  async function handleUserRoleChange(account, role) {
    const accountId = account._id || account.id

    if (!accountId || account.role === role) {
      return
    }

    try {
      setUserRoleUpdatingId(accountId)
      setError('')
      const updatedUser = await fetchJson(`/api/admin/users/${accountId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ role }),
      })
      setAdminUsers((current) => current.map((item) => ((item._id || item.id) === accountId ? updatedUser : item)))
      if ((adminUser?._id || adminUser?.id) === accountId) {
        setAdminUser((current) => (current ? { ...current, role: updatedUser.role } : current))
      }
      if ((user?._id || user?.id) === accountId) {
        setUser((current) => (current ? { ...current, role: updatedUser.role } : current))
      }
      setSuccessMessage('อัปเดตบทบาทผู้ใช้สำเร็จ')
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'อัปเดตบทบาทผู้ใช้ไม่สำเร็จ')
    } finally {
      setUserRoleUpdatingId('')
    }
  }

  if (route === 'dashboard') {
    return <DashboardPage loading={loading} projects={projects} reviews={reviews} user={user} />
  }

  if (route === 'projects') {
    return <ProjectsPage loading={loading} projects={projects} user={user} />
  }

  if (route === 'reviews') {
    return <ReviewsPage loading={loading} reviews={reviews} user={user} />
  }

  if (route === 'members') {
    return <MemberAuthPage authMode="members" user={user} reviews={reviews} userError={userError} userSuccess={userSuccess} registerForm={registerForm} userLoginForm={userLoginForm} reviewForm={reviewForm} userSubmitting={userSubmitting} reviewSubmitting={reviewSubmitting} deletingReviewId={deletingReviewId} onRegisterChange={handleChange(setRegisterForm)} onRegisterSubmit={handleUserRegisterSubmit} onUserLoginChange={handleChange(setUserLoginForm)} onUserLoginSubmit={handleUserLoginSubmit} onUserLogout={() => { setStoredToken(USER_TOKEN_KEY, ''); setUserToken(''); setUser(null); setAdminUser(null); setAdminUsers([]) }} onReviewChange={handleChange(setReviewForm)} onReviewSubmit={handleReviewSubmit} onReviewDelete={handleReviewDelete} />
  }

  if (!adminUser) {
    return <MemberAuthPage authMode="admin" user={user} reviews={reviews} userError={userError} userSuccess={userSuccess} registerForm={registerForm} userLoginForm={userLoginForm} reviewForm={reviewForm} userSubmitting={userSubmitting} reviewSubmitting={reviewSubmitting} deletingReviewId={deletingReviewId} onRegisterChange={handleChange(setRegisterForm)} onRegisterSubmit={handleUserRegisterSubmit} onUserLoginChange={handleChange(setUserLoginForm)} onUserLoginSubmit={handleUserLoginSubmit} onUserLogout={() => { setStoredToken(USER_TOKEN_KEY, ''); setUserToken(''); setUser(null); setAdminUser(null); setAdminUsers([]) }} onReviewChange={handleChange(setReviewForm)} onReviewSubmit={handleReviewSubmit} onReviewDelete={handleReviewDelete} />
  }

  return <AdminPage activeTab={activeTab} adminUser={adminUser} adminUsers={adminUsers} userRoleUpdatingId={userRoleUpdatingId} error={error} successMessage={successMessage} loading={loading} projects={projects} reviews={reviews} projectForm={projectForm} editingProjectId={editingProjectId} submittingProject={submittingProject} passwordForm={adminPasswordForm} passwordSubmitting={passwordSubmitting} onTabChange={setActiveTab} onProjectChange={handleChange(setProjectForm)} onProjectSubmit={handleProjectSubmit} onProjectEdit={(project) => { setProjectForm({ name: project.name, type: project.type, image: project.image, area: String(project.area), location: project.location, installedAt: new Date(project.installedAt).toISOString().split('T')[0], description: project.description, featured: Boolean(project.featured) }); setEditingProjectId(project._id) }} onProjectDelete={handleProjectDelete} onProjectReset={resetProjectForm} onPasswordChange={handleChange(setAdminPasswordForm)} onPasswordSubmit={handleAdminPasswordSubmit} onUserRoleChange={handleUserRoleChange} onLogout={() => { setStoredToken(USER_TOKEN_KEY, ''); setUserToken(''); setUser(null); setAdminUser(null); setAdminUsers([]) }} />
}

export default App
