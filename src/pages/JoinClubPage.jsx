import React from 'react';
import { Link } from 'react-router-dom';
import { Mic2, Radio, Headphones, Award, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import ApplicationForm from '../components/ApplicationForm';
import { useAuth } from '../context/AuthContext';
import './JoinClubPage.css';

const GUILD_PERKS = [
  {
    icon: Radio,
    title: 'Live Studio Operations',
    desc: 'Work hands-on with high-end audio interfaces, dynamic microphones, and live broadcast transmitters.'
  },
  {
    icon: Headphones,
    title: 'Audio Production Mastery',
    desc: 'Master digital audio workstations (DAWs), podcast production, sound design, and audio compression.'
  },
  {
    icon: Award,
    title: 'Campus Leadership Credential',
    desc: 'Earn official university media recognition, event management experience, and digital portfolio credits.'
  },
  {
    icon: Sparkles,
    title: 'Collaborative Creative Guild',
    desc: 'Join a tight-knit creative team of music curators, writers, designers, and live performance sound engineers.'
  }
];

export default function JoinClubPage() {
  const { isAuthenticated, user, profile } = useAuth();

  return (
    <div className="join-page-layout">
      <div className="container join-container">
        {/* Intro Section as required */}
        <div className="section-masthead">
          <div className="section-eyebrow">
            <span className="section-eyebrow-line" />
            <span>STATION RECRUITMENT • 104.2 FM</span>
          </div>
          <h1 className="section-title">JOIN CAMPUSWAVE</h1>
          <p className="section-subtitle">
            Your voice could be part of the next broadcast. Apply to contribute to the college radio club as a host, engineer, writer, or event director.
          </p>
        </div>

        {/* Authentication Context Banner */}
        <div className="join-auth-strip font-mono">
          {isAuthenticated ? (
            <div className="auth-strip-inner connected">
              <span className="auth-status-dot connected" />
              <span>
                APPLYING AS <strong>{profile?.full_name || user?.email}</strong> ({user?.email})
              </span>
              <Link to="/dashboard" className="auth-strip-link">
                <span>VIEW STUDENT DASHBOARD</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="auth-strip-inner guest">
              <span className="auth-status-dot guest" />
              <span>
                NEW APPLICANT •{' '}
                <Link to="/login?redirect=/join" className="auth-strip-action">
                  Sign in with college account
                </Link>{' '}
                to track application reviews in real time
              </span>
            </div>
          )}
        </div>

        {/* Main Grid: Application Form + Perks / What to Expect */}
        <div className="join-content-grid">
          {/* Main Form Column */}
          <div className="radio-card join-form-card">
            <div className="join-card-header">
              <div className="card-badge font-mono">OFFICIAL RECRUITMENT INTAKE</div>
              <h2 className="card-title font-display">Student Membership Application</h2>
              <p className="card-desc">
                Fill out the required information below. Submissions are queued for our executive director team and reviewed on a weekly cycle.
              </p>
            </div>

            <ApplicationForm />
          </div>

          {/* Sidebar / Perks Column */}
          <aside className="join-sidebar">
            <div className="radio-card join-perks-card">
              <h3 className="perks-heading font-display">Why Join CampusWave?</h3>
              <p className="perks-sub font-mono">104.2 FM Guild Privileges</p>

              <div className="perks-list">
                {GUILD_PERKS.map((perk, idx) => {
                  const Icon = perk.icon;
                  return (
                    <div key={idx} className="perk-item">
                      <div className="perk-icon-wrap">
                        <Icon size={16} />
                      </div>
                      <div className="perk-text">
                        <div className="perk-title font-display">{perk.title}</div>
                        <div className="perk-desc">{perk.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="recruitment-timeline font-mono">
                <div className="timeline-title">RECRUITMENT PROCESS:</div>
                <ol className="timeline-steps">
                  <li>
                    <span className="step-num">1</span>
                    <span>Submit online portfolio application</span>
                  </li>
                  <li>
                    <span className="step-num">2</span>
                    <span>Weekly review by station directors</span>
                  </li>
                  <li>
                    <span className="step-num">3</span>
                    <span>Studio voice test or portfolio walkthrough</span>
                  </li>
                  <li>
                    <span className="step-num">4</span>
                    <span>Onboarding into live station guild</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Quick Contact & Studio Location */}
            <div className="radio-card join-studio-card font-mono">
              <div className="studio-card-title">BROADCAST STUDIO</div>
              <p className="studio-card-loc">Campus Center • Studio A4, 2nd Floor</p>
              <p className="studio-card-hours">Open M-F 09:00 - 21:00 for live broadcast observation.</p>
              <Link to="/contact" className="studio-contact-link">
                <span>HAVE QUESTIONS? CONTACT STATION</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
