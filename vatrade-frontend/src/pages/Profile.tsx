import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import profileService from '../services/profile.service';
import type { UserProfile, UpdateProfileData } from '../services/profile.service';
import './Profile.css';

const Profile = () => {
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        password: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError(t.profile.passwordMismatch);
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const updateData: UpdateProfileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }

      const updated = await profileService.updateProfile(updateData);
      setProfile(updated);
      setSuccess(t.profile.updateSuccess);
      setIsEditing(false);
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || t.profile.updateError);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        password: '',
        confirmPassword: '',
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>{t.profile.loading}</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Info Card */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-avatar">
            {profile?.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info-header">
            <h2>{profile?.name}</h2>
            <span className={`badge badge-${profile?.type}`}>{profile?.type}</span>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-label">{t.profile.accountType}</span>
            <span className="stat-value">{profile?.type}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t.profile.memberSince}</span>
            <span className="stat-value">
              {profile ? new Date(profile.createdAt).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="profile-card">
          <div className="card-header-actions">
            <h3>{t.profile.personalInfo}</h3>
            {!isEditing && (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setIsEditing(true)}
              >
                ✏️ {t.profile.edit}
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t.profile.name}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.profile.email}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.profile.phone}</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="+628123456789"
              />
            </div>

            {isEditing && (
              <>
                <div className="form-divider"></div>
                <p className="form-hint">{t.profile.passwordHint}</p>
                
                <div className="form-group">
                  <label>{t.profile.newPassword}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t.profile.passwordPlaceholder}
                  />
                </div>

                <div className="form-group">
                  <label>{t.profile.confirmPassword}</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder={t.profile.confirmPasswordPlaceholder}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    {t.profile.cancel}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? t.profile.saving : t.profile.saveChanges}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
    </div>
  );
};

export default Profile;
