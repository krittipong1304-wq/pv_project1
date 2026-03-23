import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || ''
const FACEBOOK_PAGE_URL = import.meta.env.VITE_FACEBOOK_PAGE_URL?.trim() || ''
const ADMIN_TOKEN_KEY = 'floorcraft_admin_token'
const USER_TOKEN_KEY = 'floorcraft_user_token'

const initialProjectForm = { name: '', type: 'LAMINATE', image: '', area: '', location: '', installedAt: '', description: '' }
const initialAdminLoginForm = { username: '', password: '' }
const initialAdminPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' }
const initialUserRegisterForm = { email: '', phone: '', username: '', password: '' }
const initialUserLoginForm = { login: '', password: '' }
const initialReviewForm = { rating: '5', title: '', comment: '' }

function getRoute() {
  if (window.location.pathname.startsWith('/admin')) return 'admin'
  if (window.location.pathname.startsWith('/members')) return 'members'
  return 'public'
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

function PublicPage(props) {
  const { loading, projects, reviews, user } = props
  const featuredProjects = projects.slice(0, 3)
  const latestReviews = reviews.slice(0, 6)

  return (
    <div className="site-shell animate-fade-in">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => navigateTo('/')}><span>FC</span>FloorCraft</button>
        <nav className="site-nav">
          <a href="#projects">ผลงาน</a>
          <a href="#reviews">รีวิว</a>
          <button className="nav-link-button" type="button" onClick={() => navigateTo('/members')}>สมาชิก</button>
          <button className="btn-secondary" type="button" onClick={() => navigateTo('/admin')}>แอดมิน</button>
        </nav>
      </header>
      <main className="site-main">
        <section className="hero-panel glass">
          <div className="hero-copy">
            <p className="eyebrow">Members Only Reviews</p>
            <h1>สนใจสามารถติดต่อได้ที่ Page Facebook ได้เลย</h1>
            <h1></h1>
            {/* <p className="hero-text">สนใจสามารถติดต่อได้ที่ Page Facebook ได้เลย</p> */}
            <div className="hero-actions">
              <button className="btn-primary" type="button" onClick={() => navigateTo('/members')}>สมัครสมาชิก</button>
              <a className="btn-secondary" href="#reviews">ดูรีวิว</a>
              <a className="btn-secondary" href="https://web.facebook.com/profile.php?id=61560758349405" target="_blank" rel="noopener noreferrer">Page FaceBook</a>
              
            </div>
          </div>
          <div className="hero-stats">
            <article className="glass stat-tile"><span>ผลงาน</span><strong>{projects.length}</strong></article>
            <article className="glass stat-tile"><span>รีวิว</span><strong>{reviews.length}</strong></article>
            <article className="glass stat-tile"><span>สมาชิก</span><strong>{user ? user.username : 'ยังไม่เข้าสู่ระบบ'}</strong></article>
          </div>
        </section>

        <section className="site-section" id="projects">
          <div className="site-section-head"><div><p className="eyebrow">Projects</p><h2>ผลงานเด่น</h2></div></div>
          {loading ? <div className="glass loading-panel">กำลังโหลดผลงาน...</div> : (
            <div className="projects-grid">
              {featuredProjects.map((project) => (
                <article key={project._id} className="project-card glass glass-card">
                  <div className="project-img-container"><img src={project.image} alt={project.name} className="project-img" /></div>
                  <div className="project-details">
                    <h3>{project.name}</h3>
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
          )}
        </section>

        <section className="site-section" id="reviews">
          <div className="site-section-head"><div><p className="eyebrow">Reviews</p><h2>รีวิวจากสมาชิก</h2></div></div>
          {loading ? <div className="glass loading-panel">กำลังโหลดรีวิว...</div> : latestReviews.length === 0 ? <div className="glass loading-panel">ยังไม่มีรีวิว</div> : (
            <div className="customer-list">
              {latestReviews.map((review) => (
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
          )}
        </section>
      </main>
    </div>
  )
}

function MemberAuthPage(props) {
  const { user, userError, userSuccess, registerForm, userLoginForm, reviewForm, userSubmitting, reviewSubmitting, onRegisterChange, onRegisterSubmit, onUserLoginChange, onUserLoginSubmit, onUserLogout, onReviewChange, onReviewSubmit } = props

  return (
    <div className="site-shell animate-fade-in">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => navigateTo('/')}><span>FC</span>FloorCraft</button>
        <nav className="site-nav">
          <button className="btn-secondary" type="button" onClick={() => navigateTo('/')}>กลับหน้าแรก</button>
        </nav>
      </header>
      <main className="site-main">
        <section className="site-section" id="members">
          <div className="site-section-head"><div><p className="eyebrow">Members</p><h2>{user ? `สวัสดี ${user.username}` : 'สมัครสมาชิกและล็อกอินเพื่อรีวิว'}</h2></div></div>
          {userError ? <div className="feedback-banner error-banner">{userError}</div> : null}
          {userSuccess ? <div className="feedback-banner success-banner">{userSuccess}</div> : null}
          {!user ? (
            <div className="projects-grid">
              <section className="glass glass-card form-panel">
                <div className="section-title"><h2>สมัครสมาชิก</h2></div>
                <form className="project-form" onSubmit={onRegisterSubmit}>
                  <label>อีเมล<input name="email" value={registerForm.email} onChange={onRegisterChange} required /></label>
                  <label>เบอร์โทรศัพท์<input name="phone" value={registerForm.phone} onChange={onRegisterChange} required /></label>
                  <label>ชื่อผู้ใช้<input name="username" value={registerForm.username} onChange={onRegisterChange} required /></label>
                  <label>รหัสผ่าน<input name="password" type="password" minLength="8" value={registerForm.password} onChange={onRegisterChange} required /></label>
                  <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={userSubmitting}>{userSubmitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button></div>
                </form>
              </section>
              <section className="glass glass-card form-panel">
                <div className="section-title"><h2>เข้าสู่ระบบสมาชิก</h2></div>
                <form className="project-form" onSubmit={onUserLoginSubmit}>
                  <label className="full-width">อีเมลหรือชื่อผู้ใช้<input name="login" value={userLoginForm.login} onChange={onUserLoginChange} required /></label>
                  <label className="full-width">รหัสผ่าน<input name="password" type="password" value={userLoginForm.password} onChange={onUserLoginChange} required /></label>
                  <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={userSubmitting}>{userSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบสมาชิก'}</button></div>
                </form>
              </section>
            </div>
          ) : (
            <div className="projects-grid">
              <section className="glass glass-card form-panel">
                <div className="section-title"><h2>ข้อมูลสมาชิก</h2></div>
                <div className="customer-body"><div>ชื่อผู้ใช้: {user.username}</div><div>อีเมล: {user.email}</div><div>เบอร์โทรศัพท์: {user.phone}</div></div>
                <div className="form-actions" style={{ marginTop: '16px' }}><button className="btn-secondary" type="button" onClick={onUserLogout}>ออกจากระบบสมาชิก</button></div>
              </section>
              <section className="glass glass-card form-panel">
                <div className="section-title"><h2>ส่งรีวิว</h2></div>
                <form className="project-form" onSubmit={onReviewSubmit}>
                  <label>คะแนน<select name="rating" value={reviewForm.rating} onChange={onReviewChange}><option value="5">5 ดาว</option><option value="4">4 ดาว</option><option value="3">3 ดาว</option><option value="2">2 ดาว</option><option value="1">1 ดาว</option></select></label>
                  <label>หัวข้อรีวิว<input name="title" value={reviewForm.title} onChange={onReviewChange} required /></label>
                  <label className="full-width">ข้อความรีวิว<textarea name="comment" value={reviewForm.comment} onChange={onReviewChange} rows="4" required /></label>
                  <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={reviewSubmitting}>{reviewSubmitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิว'}</button></div>
                </form>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function AdminLogin({ authError, adminLoginForm, adminLoginSubmitting, onAdminLoginChange, onAdminLoginSubmit }) {
  return (
    <div className="auth-shell">
      <div className="auth-card glass glass-card animate-fade-in">
        <div className="auth-head">
          <button className="brand" type="button" onClick={() => navigateTo('/')}><span>FC</span>FloorCraft</button>
          <p className="eyebrow">ADMIN</p>
          <h1>เข้าสู่ระบบแอดมิน</h1>
          <p className="auth-text">แอดมินจัดการผลงานได้ แต่รีวิวของลูกค้าจะเป็นแบบอ่านอย่างเดียว</p>
        </div>
        {authError ? <div className="feedback-banner error-banner">{authError}</div> : null}
        <form className="project-form auth-form" onSubmit={onAdminLoginSubmit}>
          <label className="full-width">ชื่อผู้ใช้<input name="username" value={adminLoginForm.username} onChange={onAdminLoginChange} required /></label>
          <label className="full-width">รหัสผ่าน<input name="password" type="password" value={adminLoginForm.password} onChange={onAdminLoginChange} required /></label>
          <div className="form-actions full-width auth-actions">
            <button className="btn-secondary" type="button" onClick={() => navigateTo('/')}>กลับหน้าเว็บ</button>
            <button className="btn-primary" type="submit" disabled={adminLoginSubmitting}>{adminLoginSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminPage(props) {
  const { activeTab, adminUser, error, successMessage, loading, projects, reviews, projectForm, editingProjectId, submittingProject, passwordForm, passwordSubmitting, onTabChange, onProjectChange, onProjectSubmit, onProjectEdit, onProjectDelete, onProjectReset, onPasswordChange, onPasswordSubmit, onLogout } = props
  return (
    <div className="layout-container animate-fade-in">
      <aside className="sidebar">
        <div className="logo delay-1"><span>FC</span> FloorCraft</div>
        <nav className="nav-menu delay-2">
          <button className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => onTabChange('projects')}>ผลงาน</button>
          <button className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => onTabChange('reviews')}>รีวิวลูกค้า</button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => onTabChange('settings')}>รหัสผ่านแอดมิน</button>
        </nav>
        <div className="user-profile delay-3"><div className="user-avatar">{adminUser?.username?.slice(0, 1)?.toUpperCase() || 'A'}</div><div className="user-info"><div className="name">{adminUser?.username}</div><div className="role">Admin</div></div></div>
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
                <label className="full-width">รายละเอียด<textarea name="description" rows="4" value={projectForm.description} onChange={onProjectChange} required /></label>
                <div className="form-actions full-width"><button className="btn-primary" type="submit" disabled={submittingProject}>{submittingProject ? 'กำลังบันทึก...' : editingProjectId ? 'อัปเดตผลงาน' : 'เพิ่มผลงาน'}</button></div>
              </form>
            </section>
            {loading ? <div className="glass loading-panel">กำลังโหลดผลงาน...</div> : <div className="projects-grid">{projects.map((project) => <article key={project._id} className="project-card glass glass-card"><div className="project-img-container"><img src={project.image} alt={project.name} className="project-img" /></div><div className="project-details"><h3>{project.name}</h3><p>{project.description}</p><div className="project-meta"><div className="meta-item">{project.area} ตร.ม.</div><div className="meta-item">{project.location}</div></div><div className="card-actions"><button className="btn-secondary" type="button" onClick={() => onProjectEdit(project)}>แก้ไข</button><button className="btn-danger" type="button" onClick={() => onProjectDelete(project._id)}>ลบ</button></div></div></article>)}</div>}
          </>
        ) : null}
        {activeTab === 'reviews' ? (loading ? <div className="glass loading-panel">กำลังโหลดรีวิว...</div> : <div className="customer-list">{reviews.map((review) => <article key={review._id} className="glass glass-card customer-card"><div className="customer-head"><div><h3>{review.title}</h3><p>โดย {review.username}</p></div><div className="customer-meta">{review.rating}/5</div></div><div className="customer-body"><div>{review.comment}</div><div>{formatDate(review.createdAt)}</div></div></article>)}</div>) : null}
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
  const [adminUser, setAdminUser] = useState(null)
  const [adminToken, setAdminToken] = useState(() => getStoredToken(ADMIN_TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [userToken, setUserToken] = useState(() => getStoredToken(USER_TOKEN_KEY))
  const [activeTab, setActiveTab] = useState('projects')
  const [error, setError] = useState('')
  const [authError, setAuthError] = useState('')
  const [userError, setUserError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [userSuccess, setUserSuccess] = useState('')
  const [projectForm, setProjectForm] = useState(initialProjectForm)
  const [editingProjectId, setEditingProjectId] = useState('')
  const [adminLoginForm, setAdminLoginForm] = useState(initialAdminLoginForm)
  const [adminPasswordForm, setAdminPasswordForm] = useState(initialAdminPasswordForm)
  const [registerForm, setRegisterForm] = useState(initialUserRegisterForm)
  const [userLoginForm, setUserLoginForm] = useState(initialUserLoginForm)
  const [reviewForm, setReviewForm] = useState(initialReviewForm)
  const [adminLoginSubmitting, setAdminLoginSubmitting] = useState(false)
  const [userSubmitting, setUserSubmitting] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
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
    if (!adminToken) return
    fetchJson('/api/admin/me', { headers: { Authorization: `Bearer ${adminToken}` } }).then((data) => setAdminUser(data.user)).catch(() => { setStoredToken(ADMIN_TOKEN_KEY, ''); setAdminToken(''); setAdminUser(null) })
  }, [adminToken])

  useEffect(() => {
    if (!userToken) return
    fetchJson('/api/users/me', { headers: { Authorization: `Bearer ${userToken}` } }).then((data) => setUser(data.user)).catch(() => { setStoredToken(USER_TOKEN_KEY, ''); setUserToken(''); setUser(null) })
  }, [userToken])

  const commonStats = useMemo(() => ({ projects: projects.length, reviews: reviews.length }), [projects, reviews])

  function resetProjectForm() {
    setProjectForm(initialProjectForm)
    setEditingProjectId('')
  }

  function handleChange(setter) {
    return (event) => {
      const { name, value } = event.target
      setter((current) => ({ ...current, [name]: value }))
    }
  }

  async function handleAdminLoginSubmit(event) {
    event.preventDefault()
    try {
      setAdminLoginSubmitting(true)
      setAuthError('')
      const data = await fetchJson('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminLoginForm) })
      setStoredToken(ADMIN_TOKEN_KEY, data.token)
      setAdminToken(data.token)
      setAdminUser(data.user)
      setAdminLoginForm(initialAdminLoginForm)
    } catch (loginError) {
      setAuthError(loginError instanceof Error ? loginError.message : 'เข้าสู่ระบบแอดมินไม่สำเร็จ')
    } finally {
      setAdminLoginSubmitting(false)
    }
  }

  async function handleAdminPasswordSubmit(event) {
    event.preventDefault()
    try {
      const data = await fetchJson('/api/admin/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(adminPasswordForm) })
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
      setUserLoginForm(initialUserLoginForm)
      setUserSuccess('เข้าสู่ระบบสมาชิกสำเร็จ')
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

  async function handleProjectSubmit(event) {
    event.preventDefault()
    try {
      setSubmittingProject(true)
      const data = await fetchJson(`/api/projects${editingProjectId ? `/${editingProjectId}` : ''}`, { method: editingProjectId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ ...projectForm, area: Number(projectForm.area) }) })
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
      await fetchJson(`/api/projects/${projectId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } })
      setProjects((current) => current.filter((project) => project._id !== projectId))
      setSuccessMessage('ลบผลงานสำเร็จ')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'ลบผลงานไม่สำเร็จ')
    }
  }

  if (route === 'public') {
    return <PublicPage loading={loading} projects={projects} reviews={reviews} user={user} userError={userError} userSuccess={userSuccess} registerForm={registerForm} userLoginForm={userLoginForm} reviewForm={reviewForm} userSubmitting={userSubmitting} reviewSubmitting={reviewSubmitting} onRegisterChange={handleChange(setRegisterForm)} onRegisterSubmit={handleUserRegisterSubmit} onUserLoginChange={handleChange(setUserLoginForm)} onUserLoginSubmit={handleUserLoginSubmit} onUserLogout={() => { setStoredToken(USER_TOKEN_KEY, ''); setUserToken(''); setUser(null) }} onReviewChange={handleChange(setReviewForm)} onReviewSubmit={handleReviewSubmit} stats={commonStats} />
  }

  if (route === 'members') {
    return <MemberAuthPage user={user} userError={userError} userSuccess={userSuccess} registerForm={registerForm} userLoginForm={userLoginForm} reviewForm={reviewForm} userSubmitting={userSubmitting} reviewSubmitting={reviewSubmitting} onRegisterChange={handleChange(setRegisterForm)} onRegisterSubmit={handleUserRegisterSubmit} onUserLoginChange={handleChange(setUserLoginForm)} onUserLoginSubmit={handleUserLoginSubmit} onUserLogout={() => { setStoredToken(USER_TOKEN_KEY, ''); setUserToken(''); setUser(null) }} onReviewChange={handleChange(setReviewForm)} onReviewSubmit={handleReviewSubmit} />
  }

  if (!adminUser) {
    return <AdminLogin authError={authError} adminLoginForm={adminLoginForm} adminLoginSubmitting={adminLoginSubmitting} onAdminLoginChange={handleChange(setAdminLoginForm)} onAdminLoginSubmit={handleAdminLoginSubmit} />
  }

  return <AdminPage activeTab={activeTab} adminUser={adminUser} error={error} successMessage={successMessage} loading={loading} projects={projects} reviews={reviews} projectForm={projectForm} editingProjectId={editingProjectId} submittingProject={submittingProject} passwordForm={adminPasswordForm} passwordSubmitting={passwordSubmitting} onTabChange={setActiveTab} onProjectChange={handleChange(setProjectForm)} onProjectSubmit={handleProjectSubmit} onProjectEdit={(project) => { setProjectForm({ name: project.name, type: project.type, image: project.image, area: String(project.area), location: project.location, installedAt: new Date(project.installedAt).toISOString().split('T')[0], description: project.description }); setEditingProjectId(project._id) }} onProjectDelete={handleProjectDelete} onProjectReset={resetProjectForm} onPasswordChange={handleChange(setAdminPasswordForm)} onPasswordSubmit={handleAdminPasswordSubmit} onLogout={() => { setStoredToken(ADMIN_TOKEN_KEY, ''); setAdminToken(''); setAdminUser(null) }} />
}

export default App
