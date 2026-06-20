export default function Login() {
  return (
    <div className="auth-screen">
      <img className="auth-mascot" src="/mascot.svg" alt="" />
      <div className="masthead-stamp" style={{ marginBottom: 10 }}>
        Official Power Rankings
      </div>
      <h1 className="auth-title">
        Pickle <em>Royale</em>
      </h1>
      <p className="auth-sub">
        Private pickleball leagues for your crew. Sign in to start a group or join
        one with a code.
      </p>
      <a className="cta google-btn" href="/auth/login">
        <span className="g-mark">G</span> Continue with Google
      </a>
      <div className="auth-foot">Rankings · Rumbles · Respect</div>
    </div>
  );
}
