import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import ScheduleTable from '../components/ScheduleTable';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { scheduleService } from '../services/schedule-service';

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadScheduleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scheduleService.getWeeklySchedule();
      setSchedule(data || []);
    } catch (err) {
      console.warn('Error loading schedule:', err);
      setError('Something went wrong while loading this content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, []);

  return (
    <div className="schedule-page-layout">
      <div className="container">
        {/* Header */}
        <div className="section-masthead">
          <div className="section-eyebrow">
            <span className="section-eyebrow-line" />
            <span>TRANSMISSION LINEUP</span>
          </div>
          <h1 className="section-title">RADIO SCHEDULE</h1>
          <p className="section-subtitle">
            Find out what's coming up on CampusWave.
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading schedule..." />
        ) : error ? (
          <ErrorState
            title="Something went wrong while loading this content."
            description="We were unable to load the broadcast timetable from the server."
            onRetry={loadScheduleData}
          />
        ) : (
          <ScheduleTable schedule={schedule} />
        )}
      </div>

      <style>{`
        .schedule-page-layout {
          padding: 44px 0 80px;
        }
      `}</style>
    </div>
  );
}
