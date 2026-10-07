import React, { useState, useEffect, useMemo } from 'react';
import { Users, Radio } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import RadioWave from '../components/RadioWave';
import TeamMemberCard from '../components/TeamMemberCard';
import { teamService } from '../services/team-service';
import './TeamPage.css';

const ROLE_CATEGORIES = [
  'ON AIR',
  'CONTENT',
  'PRODUCTION',
  'TECHNICAL',
  'CREATIVE',
  'EVENTS'
];

function normalizeCategory(member) {
  if (member.category) {
    const cat = member.category.toUpperCase().trim();
    if (ROLE_CATEGORIES.includes(cat)) return cat;
    if (cat.includes('AIR') || cat.includes('HOST') || cat.includes('RJ')) return 'ON AIR';
    if (cat.includes('CONTENT') || cat.includes('SCRIPT')) return 'CONTENT';
    if (cat.includes('PROD') || cat.includes('MIX') || cat.includes('AUDIO')) return 'PRODUCTION';
    if (cat.includes('TECH') || cat.includes('ENG') || cat.includes('STREAM')) return 'TECHNICAL';
    if (cat.includes('CREATIVE') || cat.includes('DESIGN') || cat.includes('ART')) return 'CREATIVE';
    if (cat.includes('EVENT') || cat.includes('FEST')) return 'EVENTS';
  }

  // Deduce from role if category is absent
  const role = (member.role || '').toLowerCase();
  if (role.includes('rj') || role.includes('host') || role.includes('on-air') || role.includes('voice')) {
    return 'ON AIR';
  }
  if (role.includes('content') || role.includes('writer') || role.includes('script') || role.includes('editor')) {
    return 'CONTENT';
  }
  if (role.includes('producer') || role.includes('sound') || role.includes('audio') || role.includes('mixing')) {
    return 'PRODUCTION';
  }
  if (role.includes('tech') || role.includes('engineer') || role.includes('developer') || role.includes('broadcast')) {
    return 'TECHNICAL';
  }
  if (role.includes('design') || role.includes('creative') || role.includes('visual') || role.includes('media')) {
    return 'CREATIVE';
  }
  if (role.includes('event') || role.includes('logistics') || role.includes('coordinator')) {
    return 'EVENTS';
  }

  return 'ON AIR';
}

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeam = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamService.getPublishedTeamMembers();
      setMembers(data);
    } catch (err) {
      console.warn('Error loading team roster:', err.message);
      setError('Unable to retrieve the team roster at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // Group members into defined categories, only keeping categories that actually contain members
  const groupedMembers = useMemo(() => {
    if (!members || members.length === 0) return {};

    const map = {};
    for (const member of members) {
      const group = normalizeCategory(member);
      if (!map[group]) {
        map[group] = [];
      }
      map[group].push(member);
    }
    return map;
  }, [members]);

  const activeCategories = useMemo(() => {
    return ROLE_CATEGORIES.filter(cat => groupedMembers[cat] && groupedMembers[cat].length > 0);
  }, [groupedMembers]);

  return (
    <div className="team-page-layout">
      <div className="container team-container">
        {/* Team Hero Section */}
        <div className="team-hero-header">
          <div className="team-eyebrow font-mono">
            <RadioWave count={4} isLive={true} />
            <span>COLLEGE BROADCAST GUILD</span>
          </div>

          <h1 className="team-main-title font-display">OUR TEAM</h1>

          <p className="team-main-subtitle">
            The students behind the voices, production, technology and stories of CampusWave.
          </p>

          <div className="team-hero-radio-accent" aria-hidden="true">
            <span className="accent-line" />
            <span className="accent-frequency font-mono">104.2 FM • STUDIO CREW</span>
            <span className="accent-line" />
          </div>
        </div>

        {/* Dynamic States */}
        {loading ? (
          <LoadingState message="Connecting to station roster..." />
        ) : error ? (
          <ErrorState
            title="Failed to Load Team Roster"
            message={error}
            onRetry={fetchTeam}
          />
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="TEAM PROFILES COMING SOON"
            description="CampusWave's student team will appear here once profiles are published."
          />
        ) : (
          <div className="team-groups-container">
            {activeCategories.map(cat => {
              const groupList = groupedMembers[cat];
              return (
                <section key={cat} className="team-group-section" aria-label={`${cat} Team`}>
                  <div className="group-header">
                    <div className="group-badge font-mono">
                      <span className="group-dot" />
                      <span>{cat} GUILD</span>
                    </div>
                    <span className="group-count font-mono">
                      {groupList.length} {groupList.length === 1 ? 'MEMBER' : 'MEMBERS'}
                    </span>
                  </div>

                  <div className="team-grid">
                    {groupList.map(member => (
                      <TeamMemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
